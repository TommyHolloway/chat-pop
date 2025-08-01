-- Fix plan constraint to allow standard plan and remove conflicting constraints
-- This fixes the admin portal user profile update issue

-- Drop the old conflicting constraint that only allows 'free' and 'pro'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Ensure we have the correct constraint that allows all valid plans
-- First drop any existing valid_plans constraint to recreate it cleanly
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS valid_plans;

-- Add the correct constraint with all three valid plans
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_plans 
CHECK (plan IN ('free', 'hobby', 'standard'));