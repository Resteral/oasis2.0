-- Phase 23: Live Analytics & Business Insights

-- 1. Analytics Events Table (Raw Tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'click', 'search', 'order_start', 'conversion'
    page_url TEXT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}', -- Store query strings, categories, etc.
    session_id TEXT, -- For funnel tracking
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_business_time ON analytics_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

-- 2. Daily Stats (Cached Aggregations for Charts)
CREATE TABLE IF NOT EXISTS daily_business_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    UNIQUE(business_id, stat_date)
);

-- 3. Function to update daily stats automatically on new event
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_business_stats (business_id, stat_date, total_views, total_clicks)
    VALUES (
        NEW.business_id, 
        CURRENT_DATE, 
        CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END
    )
    ON CONFLICT (business_id, stat_date) DO UPDATE SET
        total_views = daily_business_stats.total_views + (CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END),
        total_clicks = daily_business_stats.total_clicks + (CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END),
        total_revenue = daily_business_stats.total_revenue + (CASE WHEN NEW.event_type = 'conversion' THEN (NEW.metadata->>'amount')::decimal ELSE 0 END);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_stats
AFTER INSERT ON analytics_events
FOR EACH ROW
EXECUTE FUNCTION update_daily_stats();

-- 4. Sample Data (Optional for testing)
-- INSERT INTO analytics_events (business_id, event_type, metadata) 
-- VALUES ('<business_id>', 'view', '{"page": "home"}');
