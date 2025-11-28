-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    age_range TEXT CHECK (
        age_range IN (
            'under_18',
            '18_24',
            '25_34',
            '35_44',
            '45_54',
            '55_64',
            '65_plus'
        )
    ),
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create test_results table
CREATE TABLE public.test_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_time INTEGER NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_reaction_time CHECK (
        reaction_time > 0
        AND reaction_time < 10000
    )
);
-- Create user_stats table
CREATE TABLE public.user_stats (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    best_time INTEGER,
    worst_time INTEGER,
    average_time DECIMAL(10, 2),
    total_tests INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create indexes
CREATE INDEX idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX idx_test_results_taken_at ON public.test_results(taken_at DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);