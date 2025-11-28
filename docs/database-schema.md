# Database Schema

## Tables

### profiles

- `id` (UUID, PRIMARY KEY) - References auth.users(id)
- `username` (TEXT) - User's display name
- `email` (TEXT, UNIQUE) - User's email
- `age_range` (TEXT) - Optional age range (under_18, 18_24, 25_34, 35_44, 45_54, 55_64, 65_plus)
- `profile_picture_url` (TEXT) - URL to profile picture
- `created_at` (TIMESTAMP) - Account creation date
- `updated_at` (TIMESTAMP) - Last profile update

### user_stats

- `user_id` (UUID, PRIMARY KEY) - References profiles(id)
- `best_time` (INTEGER) - Best reaction time in ms
- `worst_time` (INTEGER) - Worst reaction time in ms
- `average_time` (DECIMAL) - Average reaction time
- `total_tests` (INTEGER) - Number of tests taken
- `updated_at` (TIMESTAMP) - Last stats update

### test_results

- `id` (UUID, PRIMARY KEY) - Unique test ID
- `user_id` (UUID) - References profiles(id)
- `reaction_time` (INTEGER) - Reaction time in ms
- `taken_at` (TIMESTAMP) - When test was taken

## Setup

Run the SQL scripts in `database/` folder in order:

1. `01_create_tables.sql`
2. `02_create_triggers.sql`
3. `03_create_policies.sql`
