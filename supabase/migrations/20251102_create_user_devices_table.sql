-- Migration: Create user_devices table for 3-device limit enforcement (anti-account sharing)
-- Date: 2025-11-02
-- Description: Implements device tracking with stable fingerprinting (IDFV/AndroidId) that survives OS updates

-- Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_model TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  os_version TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Unique constraint: one user can't have duplicate device fingerprints
  CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint)
);

-- Index for fast lookups of active devices per user (most common query)
CREATE INDEX idx_user_devices_user_active ON user_devices(user_id, is_active) WHERE is_active = true;

-- Index for cleanup queries (find inactive devices)
CREATE INDEX idx_user_devices_last_active ON user_devices(last_active_at) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own devices
CREATE POLICY "Users can view own devices"
  ON user_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own devices
CREATE POLICY "Users can insert own devices"
  ON user_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own devices
CREATE POLICY "Users can update own devices"
  ON user_devices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own devices
CREATE POLICY "Users can delete own devices"
  ON user_devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update last_active_at timestamp
CREATE OR REPLACE FUNCTION update_device_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active_at on any device update
CREATE TRIGGER trigger_update_device_last_active
  BEFORE UPDATE ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_last_active();

-- Add helpful comments for documentation
COMMENT ON TABLE user_devices IS 'Tracks user devices for 3-device limit enforcement to prevent account sharing';
COMMENT ON COLUMN user_devices.device_fingerprint IS 'SHA256 hash of (platform + vendor ID). Stable across OS updates. Uses IDFV on iOS, AndroidId on Android.';
COMMENT ON COLUMN user_devices.device_name IS 'User-editable device name for easy identification (e.g., "John''s iPhone", "Work iPad")';
COMMENT ON COLUMN user_devices.platform IS 'Device platform: ios or android';
COMMENT ON COLUMN user_devices.os_version IS 'Metadata only - not used in fingerprint to survive OS updates';
COMMENT ON COLUMN user_devices.is_active IS 'False when device is removed by user - triggers automatic sign-out on that device';
COMMENT ON COLUMN user_devices.last_active_at IS 'Automatically updated on every device activity - helps users identify inactive devices';
