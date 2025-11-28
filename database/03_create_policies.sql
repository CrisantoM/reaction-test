-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Service role can insert profiles" ON public.profiles FOR
INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
-- Test results policies
CREATE POLICY "Users can view all test results" ON public.test_results FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own test results" ON public.test_results FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own test results" ON public.test_results FOR DELETE USING (auth.uid() = user_id);
-- User stats policies
CREATE POLICY "Anyone can view stats" ON public.user_stats FOR
SELECT USING (true);
CREATE POLICY "Service role can insert stats" ON public.user_stats FOR
INSERT WITH CHECK (true);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR
UPDATE USING (auth.uid() = user_id);
```

### **3. Git Files**

**`.gitignore `** (update if not already included):
``` # dependencies
/ node_modules /.pnp.pnp.js # testing
/ coverage # production
/ build # misc
.DS_Store.env.env.local.env.development.local.env.test.local.env.production.local npm - debug.log * yarn - debug.log * yarn - error.log * # IDE
.vscode /.idea / *.swp *.swo * ~ # OS
Thumbs.db