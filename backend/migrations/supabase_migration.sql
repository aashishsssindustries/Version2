-- ============================================================
-- WealthMax Migration - Supabase Compatible (FIXED)
-- Run each section separately if you encounter errors
-- ============================================================

-- ============================================================
-- PART 1: PROFILES TABLE - Add columns (Run this first)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_fund_amount NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_cover NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health_score_components JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_score_calculated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Salaried';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS investment_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_income NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS risk_class TEXT;

-- ============================================================
-- PART 2: ACTION_ITEMS TABLE (Run this second)
-- Note: Change 'users' to 'auth.users' if using Supabase Auth
-- ============================================================

-- First, check if table exists and drop if needed for clean slate
-- DROP TABLE IF EXISTS action_items;

CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'Medium',
    severity TEXT DEFAULT 'Medium',
    gap_amount NUMERIC DEFAULT 0,
    estimated_score_impact INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    action TEXT,
    linked_tool TEXT,
    persona_context TEXT,
    risk_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 3: SURVEY_RESPONSES TABLE (Run this third)
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    responses JSONB NOT NULL DEFAULT '{}',
    risk_score INTEGER DEFAULT 0,
    final_class TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 4: INDEXES (Run after tables are created)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- ============================================================
-- PART 5: BACKFILL DATA (Run last)
-- ============================================================

UPDATE profiles 
SET emergency_fund_amount = COALESCE(existing_assets * 0.3, 0)
WHERE emergency_fund_amount IS NULL OR emergency_fund_amount = 0;

UPDATE profiles 
SET monthly_income = COALESCE(gross_income / 12, 0)
WHERE monthly_income IS NULL;

-- ============================================================
-- DONE! All migrations applied successfully.
-- ============================================================
