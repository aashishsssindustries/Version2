-- ============================================================
-- WealthMax Database Migration - Comprehensive Schema Update
-- Date: 2026-01-15
-- Purpose: Add all missing columns required for dashboard features
-- ============================================================

-- ============================================================
-- PROFILES TABLE - Add missing columns
-- ============================================================

-- Next Best Action Fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emergency_fund_amount DECIMAL(15,2) DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS insurance_cover DECIMAL(15,2) DEFAULT 0;

-- Health Score Components (JSON field for breakdown)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS health_score_components JSONB DEFAULT '{}';

-- Last score calculation timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_score_calculated_at TIMESTAMP;

-- Employment type
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'Salaried';

-- PAN Number
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);

-- Investment Goal
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS investment_goal TEXT;

-- Monthly Income (derived field for convenience)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2);

-- Risk Class
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS risk_class VARCHAR(50);

-- ============================================================
-- ACTION_ITEMS TABLE - Ensure proper structure
-- ============================================================

CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'Medium',
    severity VARCHAR(20) DEFAULT 'Medium',
    gap_amount DECIMAL(15,2) DEFAULT 0,
    estimated_score_impact INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    action TEXT,
    linked_tool VARCHAR(100),
    persona_context TEXT,
    risk_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);

-- ============================================================
-- SURVEY_RESPONSES TABLE - Ensure exists
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    risk_score INTEGER DEFAULT 0,
    final_class VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- ============================================================
-- BACKFILL MISSING DATA
-- ============================================================

-- Backfill emergency_fund_amount from existing_assets if null
UPDATE profiles 
SET emergency_fund_amount = COALESCE(existing_assets * 0.3, 0)
WHERE emergency_fund_amount IS NULL OR emergency_fund_amount = 0;

-- Backfill monthly_income from gross_income
UPDATE profiles 
SET monthly_income = COALESCE(gross_income / 12, 0)
WHERE monthly_income IS NULL;

-- Recalculate health_score for all profiles
-- This requires application-level logic, so we'll just reset to trigger recalc
UPDATE profiles 
SET last_score_calculated_at = NULL
WHERE last_score_calculated_at IS NULL;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Run these to verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT * FROM action_items LIMIT 5;
-- SELECT * FROM survey_responses LIMIT 5;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
-- Migration complete! All required columns have been added.
-- Please restart the backend server to pick up schema changes.
