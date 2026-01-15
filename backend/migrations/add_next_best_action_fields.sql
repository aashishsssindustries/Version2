-- Migration: Add Next Best Action fields to profiles table
-- Date: 2026-01-15

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emergency_fund_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_cover DECIMAL(15,2) DEFAULT 0;

-- Backfill existing records with safe defaults
UPDATE profiles 
SET emergency_fund_amount = 0, 
    dependents = 0, 
    insurance_cover = 0
WHERE emergency_fund_amount IS NULL 
   OR dependents IS NULL 
   OR insurance_cover IS NULL;
