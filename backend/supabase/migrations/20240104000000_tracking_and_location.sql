-- UniMove Database Schema - Tracking & Location
-- Description: Real-time location tracking, route history, and geospatial features

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- LOCATION TRACKING
-- =====================================================

-- Provider location tracking (real-time)
CREATE TABLE provider_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Location data
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(10,2), -- in meters
    altitude DECIMAL(10,2), -- in meters
    heading DECIMAL(5,2), -- 0-360 degrees
    speed DECIMAL(10,2), -- in km/h
    
    -- PostGIS geometry point
    location GEOGRAPHY(POINT, 4326),
    
    -- Status
    is_moving BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT TRUE,
    battery_level INTEGER, -- 0-100
    
    -- Associated order (if currently on a job)
    current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_coordinates CHECK (
        latitude BETWEEN -90 AND 90 AND 
        longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_heading CHECK (heading IS NULL OR (heading >= 0 AND heading <= 360)),
    CONSTRAINT valid_battery CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100))
);

-- Location history (for route replay and analytics)
CREATE TABLE location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Location data
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(10,2),
    speed DECIMAL(10,2),
    heading DECIMAL(5,2),
    
    -- PostGIS geometry
    location GEOGRAPHY(POINT, 4326),
    
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order tracking events
CREATE TABLE order_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Event details
    event_type TEXT NOT NULL, -- started, arrived_pickup, picked_up, in_transit, arrived_delivery, completed
    event_title TEXT NOT NULL,
    event_description TEXT,
    
    -- Location at event time
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326),
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geofences (for location-based triggers)
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Geofence area (polygon or circle)
    area GEOGRAPHY(POLYGON, 4326) NOT NULL,
    radius DECIMAL(10,2), -- in meters (for circular geofences)
    
    -- Center point (for circular geofences)
    center_latitude DECIMAL(10,8),
    center_longitude DECIMAL(11,8),
    
    -- Type and purpose
    fence_type TEXT NOT NULL, -- pickup_zone, delivery_zone, service_area, restricted_area
    
    -- Associated entities
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geofence events (when provider enters/exits geofence)
CREATE TABLE geofence_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL, -- entered, exited
    
    -- Location at event
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Routes (planned and actual routes)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Route type
    route_type TEXT NOT NULL, -- planned, actual
    
    -- Route data (array of coordinates)
    route_points JSONB NOT NULL, -- [{lat, lng, timestamp}, ...]
    route_line GEOGRAPHY(LINESTRING, 4326),
    
    -- Route metrics
    total_distance DECIMAL(10,2), -- in km
    total_duration INTEGER, -- in minutes
    
    -- Waypoints
    waypoints JSONB, -- [{lat, lng, type, name}, ...]
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Distance matrix cache (for performance optimization)
CREATE TABLE distance_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Origin
    origin_latitude DECIMAL(10,8) NOT NULL,
    origin_longitude DECIMAL(11,8) NOT NULL,
    
    -- Destination
    destination_latitude DECIMAL(10,8) NOT NULL,
    destination_longitude DECIMAL(11,8) NOT NULL,
    
    -- Distance and duration
    distance DECIMAL(10,2) NOT NULL, -- in km
    duration INTEGER NOT NULL, -- in minutes
    
    -- Source
    source TEXT NOT NULL DEFAULT 'google_maps', -- google_maps, calculated
    
    -- Cache expiry
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(origin_latitude, origin_longitude, destination_latitude, destination_longitude)
);

-- Create indexes
CREATE INDEX idx_provider_locations_provider ON provider_locations(provider_id);
CREATE INDEX idx_provider_locations_order ON provider_locations(current_order_id);
CREATE INDEX idx_provider_locations_online ON provider_locations(is_online);
CREATE INDEX idx_provider_locations_created ON provider_locations(created_at DESC);

-- Spatial index for location queries
CREATE INDEX idx_provider_locations_geography ON provider_locations USING GIST(location);

CREATE INDEX idx_location_history_provider ON location_history(provider_id);
CREATE INDEX idx_location_history_order ON location_history(order_id);
CREATE INDEX idx_location_history_recorded ON location_history(recorded_at DESC);
CREATE INDEX idx_location_history_geography ON location_history USING GIST(location);

CREATE INDEX idx_order_tracking_events_order ON order_tracking_events(order_id);
CREATE INDEX idx_order_tracking_events_provider ON order_tracking_events(provider_id);
CREATE INDEX idx_order_tracking_events_type ON order_tracking_events(event_type);
CREATE INDEX idx_order_tracking_events_created ON order_tracking_events(created_at DESC);

CREATE INDEX idx_geofences_order ON geofences(order_id);
CREATE INDEX idx_geofences_type ON geofences(fence_type);
CREATE INDEX idx_geofences_active ON geofences(is_active);
CREATE INDEX idx_geofences_geography ON geofences USING GIST(area);

CREATE INDEX idx_geofence_events_geofence ON geofence_events(geofence_id);
CREATE INDEX idx_geofence_events_provider ON geofence_events(provider_id);
CREATE INDEX idx_geofence_events_order ON geofence_events(order_id);

CREATE INDEX idx_routes_order ON routes(order_id);
CREATE INDEX idx_routes_provider ON routes(provider_id);
CREATE INDEX idx_routes_type ON routes(route_type);

CREATE INDEX idx_distance_matrix_origin ON distance_matrix(origin_latitude, origin_longitude);
CREATE INDEX idx_distance_matrix_destination ON distance_matrix(destination_latitude, destination_longitude);
CREATE INDEX idx_distance_matrix_expires ON distance_matrix(expires_at);

-- Function to update PostGIS geography from lat/lng
CREATE OR REPLACE FUNCTION update_location_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply geography update triggers
CREATE TRIGGER update_provider_location_geography
    BEFORE INSERT OR UPDATE ON provider_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geography();

CREATE TRIGGER update_location_history_geography
    BEFORE INSERT OR UPDATE ON location_history
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geography();

CREATE TRIGGER update_order_tracking_geography
    BEFORE INSERT OR UPDATE ON order_tracking_events
    FOR EACH ROW
    WHEN (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL)
    EXECUTE FUNCTION update_location_geography();

-- Function to archive old location data
CREATE OR REPLACE FUNCTION archive_old_location_history()
RETURNS void AS $$
BEGIN
    -- Move location history older than 30 days to archive table (if needed)
    -- For now, just delete old records
    DELETE FROM location_history
    WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    -- Clean up expired distance matrix cache
    DELETE FROM distance_matrix
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby providers
CREATE OR REPLACE FUNCTION find_nearby_providers(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_km DECIMAL DEFAULT 10,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    provider_id UUID,
    distance_km DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL,
    is_online BOOLEAN,
    current_order_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.provider_id,
        ROUND((ST_Distance(
            pl.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) / 1000)::numeric, 2) as distance_km,
        pl.latitude,
        pl.longitude,
        pl.is_online,
        pl.current_order_id
    FROM provider_locations pl
    WHERE 
        pl.is_online = TRUE
        AND ST_DWithin(
            pl.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_km * 1000
        )
    ORDER BY pl.location <-> ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND((ST_Distance(
        ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
    ) / 1000)::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check if point is within geofence
CREATE OR REPLACE FUNCTION is_within_geofence(
    p_geofence_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_area GEOGRAPHY;
BEGIN
    SELECT area INTO v_area
    FROM geofences
    WHERE id = p_geofence_id AND is_active = TRUE;
    
    IF v_area IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN ST_Contains(
        v_area::geometry,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
    );
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE provider_locations IS 'Real-time provider location tracking';
COMMENT ON TABLE location_history IS 'Historical location data for route replay';
COMMENT ON TABLE order_tracking_events IS 'Key events during order fulfillment';
COMMENT ON TABLE geofences IS 'Geographic boundaries for location-based triggers';
COMMENT ON TABLE geofence_events IS 'Log of geofence entry/exit events';
COMMENT ON TABLE routes IS 'Planned and actual routes for orders';
COMMENT ON TABLE distance_matrix IS 'Cached distance calculations for performance';
