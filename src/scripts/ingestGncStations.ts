import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

declare const process: any;

// Load .env.local explicitly since this is a standalone script
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') }); // Fallback

// Setup connection details from process.env now that dotenv has loaded them
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_QUERY = `
[out:json];
area["ISO3166-1"="AR"]->.searchArea;
node["amenity"="fuel"]["fuel:cng"="yes"](area.searchArea);
out center;
`;

interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassResponse {
  elements: OverpassNode[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ingestGncStations() {
  console.log('Starting ingestion of GNC stations from Overpass API...');

  try {
    // 1. Fetch data from Overpass API
    console.log(`Fetching stations... Query:\n${OVERPASS_QUERY}`);
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      body: OVERPASS_QUERY,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API responded with status: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OverpassResponse;
    const nodes = data.elements || [];
    
    console.log(`Successfully fetched ${nodes.length} stations from Overpass API.`);

    if (nodes.length === 0) {
      console.log('No stations found, exiting early.');
      return;
    }

    // 2. Transform the data
    const stationsToInsert = nodes.map((node) => {
      const tags = node.tags || {};
      const name = tags.name || `GNC Station (${node.id})`;
      const street = tags['addr:street'] || '';
      const city = tags['addr:city'] || '';
      const addressParts = [street, city].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(', ') : 'Unknown address';
      
      return {
        name,
        address,
        is_open: true, // Assuming default true, as OSM doesn't always have live status
        location: `POINT(${node.lon} ${node.lat})`, // WKT format for PostGIS
      };
    });

    console.log('Transform complete. Preparing to insert into Supabase...');

    // 3. Batch insert into Supabase
    // Inserting in chunks of 500 to avoid overloading the DB or payload size limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < stationsToInsert.length; i += CHUNK_SIZE) {
      const chunk = stationsToInsert.slice(i, i + CHUNK_SIZE);
      
      console.log(`Inserting chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(stationsToInsert.length / CHUNK_SIZE)}...`);
      
      const { error } = await supabase
        .from('gnc_stations')
        .insert(chunk);

      if (error) {
        console.error(`Error inserting chunk ${i / CHUNK_SIZE + 1}:`, error.message, error.details);
      } else {
        console.log(`Chunk ${i / CHUNK_SIZE + 1} inserted successfully.`);
      }

      // Brief pause to play nice with rate limits
      await sleep(200);
    }

    console.log('Ingestion completed successfully.');

  } catch (error) {
    console.error('An error occurred during ingestion:', error);
  }
}

// Execute the function
ingestGncStations();
