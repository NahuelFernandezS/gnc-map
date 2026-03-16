-- Enable the PostGIS extension if it doesn't already exist
create extension if not exists postgis;

-- Create the gnc_stations table
create table if not exists public.gnc_stations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    address text not null,
    is_open boolean default true not null,
    -- The location is stored as a POINT geometry with SRID 4326 (WGS 84, standard lon/lat)
    location geometry(Point, 4326) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: In PostGIS, longitude (X) always comes before latitude (Y)
-- Example manual insert: 
-- insert into public.gnc_stations (name, address, is_open, location) values ('Station 1', '123 St', true, st_point(-58.3816, -34.6037));

-- Create a spatial index to speed up geographical queries
create index if not exists gnc_stations_location_idx
  on public.gnc_stations
  using gist (location);

-- Function to find nearby stations
-- Returns a table containing the station data plus the calculated distance in meters
create or replace function public.get_nearby_stations(
    user_lat float,
    user_lon float,
    radius_meters float
)
returns table (
    id uuid,
    name text,
    address text,
    is_open boolean,
    lat float,
    lng float,
    distance_meters float
)
language sql
as $$
    -- We cast geometry(Point, 4326) to geography to get precise distances in meters
    -- ST_Point parameters must be in order (longitude, latitude)
    -- ST_DWithin filters rows quickly using the spatial index
    -- ST_Distance calculates the exact distance for sorting
    select
        s.id,
        s.name,
        s.address,
        s.is_open,
        st_y(s.location::geometry) as lat,
        st_x(s.location::geometry) as lng,
        st_distance(s.location::geography, st_point(user_lon, user_lat)::geography) as distance_meters
    from
        public.gnc_stations s
    where
        st_dwithin(
            s.location::geography,
            st_point(user_lon, user_lat)::geography,
            radius_meters
        )
    order by
        distance_meters asc;
$$;
