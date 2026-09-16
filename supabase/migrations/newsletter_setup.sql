-- Sothis Therapeutic Massage - Newsletter System Database Migration
-- Run to create newsletter_subscribers, newsletters, and delivery audit tables

-- 1. Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    unsubscribe_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    source TEXT DEFAULT 'home_popup', -- 'home_popup', 'client_sync', 'footer', 'manual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token ON newsletter_subscribers(unsubscribe_token);

-- 2. Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    preview_text TEXT,
    body TEXT NOT NULL,
    image_url TEXT,
    cta_text TEXT DEFAULT 'Chat with Nancy on WhatsApp',
    cta_url TEXT DEFAULT 'https://sothistherapeutic.com/api/newsletter/cta',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sent')),
    sent_at TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created ON newsletters(created_at DESC);

-- 3. Create newsletter_deliveries table for auditing
CREATE TABLE IF NOT EXISTS newsletter_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_newsletter ON newsletter_deliveries(newsletter_id);

-- 4. Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_deliveries ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage newsletter_subscribers" ON newsletter_subscribers
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can manage newsletters" ON newsletters
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can manage newsletter_deliveries" ON newsletter_deliveries
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

-- Public can read active subscriber status via token or subscribe
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- 5. Backfill existing clients as active subscribers
INSERT INTO newsletter_subscribers (email, client_id, is_active, source)
SELECT LOWER(TRIM(email)), id, true, 'client_sync'
FROM clients
WHERE email IS NOT NULL AND email != ''
ON CONFLICT (email) DO UPDATE
SET client_id = EXCLUDED.client_id, is_active = true;
