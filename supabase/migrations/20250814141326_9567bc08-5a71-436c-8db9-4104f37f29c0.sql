-- Add initial_message and creativity_level fields to agents table
ALTER TABLE public.agents 
ADD COLUMN initial_message TEXT,
ADD COLUMN creativity_level INTEGER DEFAULT 5 CHECK (creativity_level >= 1 AND creativity_level <= 10);