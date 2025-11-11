-- Supabase Database Schema for AR Model Sharing Application
-- Run this in the Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  model_url TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('ready', 'warning', 'error')),
  validation_issues JSONB DEFAULT '[]'::jsonb,
  uploaded_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared Links table
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  views INTEGER DEFAULT 0,
  scans INTEGER DEFAULT 0,
  created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity table
CREATE TABLE IF NOT EXISTS activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('upload', 'share', 'view', 'scan')),
  description TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_uploaded_at ON models(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_model_id ON shared_links(model_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_created_at ON shared_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Models policies
CREATE POLICY "Users can view their own models"
  ON models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own models"
  ON models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models"
  ON models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models"
  ON models FOR DELETE
  USING (auth.uid() = user_id);

-- Shared links policies
CREATE POLICY "Users can view their own shared links"
  ON shared_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active shared links"
  ON shared_links FOR SELECT
  USING (is_active = true AND expires_at > EXTRACT(EPOCH FROM NOW()) * 1000);

CREATE POLICY "Users can insert their own shared links"
  ON shared_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared links"
  ON shared_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared links"
  ON shared_links FOR DELETE
  USING (auth.uid() = user_id);

-- Activity policies
CREATE POLICY "Users can view their own activity"
  ON activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper functions for incrementing counters
CREATE OR REPLACE FUNCTION increment_views(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_links
  SET views = views + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_scans(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_links
  SET scans = scans + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
