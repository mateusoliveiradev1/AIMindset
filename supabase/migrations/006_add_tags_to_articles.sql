-- Migration: Add tags column to articles table
-- This migration adds a tags column to store article tags as text

-- Add tags column to articles table
ALTER TABLE articles ADD COLUMN tags TEXT;

-- Add comment to the column
COMMENT ON COLUMN articles.tags IS 'Comma-separated list of article tags';