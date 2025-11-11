-- Migration to add public access policy for models referenced by active shared links
-- Run this in your Supabase SQL Editor to fix share link viewing

-- Add policy to allow public viewing of models that are referenced by active shared links
CREATE POLICY "Public can view models referenced by active shared links"
  ON models FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_links
      WHERE shared_links.model_id = models.id
        AND shared_links.is_active = true
        AND shared_links.expires_at > EXTRACT(EPOCH FROM NOW()) * 1000
    )
  );
