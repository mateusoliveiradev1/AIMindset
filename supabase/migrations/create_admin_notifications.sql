-- Create admin_notifications table with minimal fields used by AdminHeader
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255),
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  severity VARCHAR(20) DEFAULT 'low',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Enable RLS and add policies
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage notifications
CREATE POLICY admin_notifications_authenticated_select ON admin_notifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_notifications_authenticated_write ON admin_notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Full access for service_role
CREATE POLICY admin_notifications_service_role_all ON admin_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON admin_notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_notifications TO authenticated;

-- Ensure PostgREST reloads schema
NOTIFY pgrst, 'reload schema';