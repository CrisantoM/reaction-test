-- Function to automatically create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE user_username TEXT;
user_age_range TEXT;
BEGIN -- Extract username from metadata, fallback to email prefix
user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
);
-- Extract age_range from metadata
user_age_range := NEW.raw_user_meta_data->>'age_range';
-- Insert into profiles with metadata values
INSERT INTO public.profiles (id, email, username, age_range)
VALUES (
        NEW.id,
        NEW.email,
        user_username,
        user_age_range
    );
-- Insert into user_stats
INSERT INTO public.user_stats (user_id)
VALUES (NEW.id);
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE LOG 'Error in handle_new_user: %',
SQLERRM;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Function to update user stats after test submission
CREATE OR REPLACE FUNCTION public.update_user_stats() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.user_stats (
        user_id,
        best_time,
        worst_time,
        average_time,
        total_tests
    )
VALUES (
        NEW.user_id,
        NEW.reaction_time,
        NEW.reaction_time,
        NEW.reaction_time,
        1
    ) ON CONFLICT (user_id) DO
UPDATE
SET best_time = LEAST(user_stats.best_time, NEW.reaction_time),
    worst_time = GREATEST(user_stats.worst_time, NEW.reaction_time),
    total_tests = user_stats.total_tests + 1,
    average_time = (
        SELECT AVG(reaction_time)
        FROM public.test_results
        WHERE user_id = NEW.user_id
    ),
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to automatically update stats
CREATE TRIGGER on_test_result_created
AFTER
INSERT ON public.test_results FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();