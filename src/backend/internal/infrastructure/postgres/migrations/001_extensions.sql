-- Migration: 001_extensions.sql
-- Description: Enable required PostgreSQL extensions for the application
-- Author: System
-- Created: 2026-01-25

-- ============================================================================
-- UUID Generation Extension
-- Provides uuid_generate_v4() for generating RFC 4122 compliant UUIDs
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Vector Extension (pgvector)
-- Enables vector similarity search for AI embeddings
-- Required for semantic search on proposal content
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- Trigram Extension
-- Enables fuzzy text search and similarity matching
-- Used for autocomplete and typo-tolerant search
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- Verify extensions are installed
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE EXCEPTION 'uuid-ossp extension not installed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'vector extension not installed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        RAISE EXCEPTION 'pg_trgm extension not installed';
    END IF;

    RAISE NOTICE 'All required extensions verified successfully';
END $$;
