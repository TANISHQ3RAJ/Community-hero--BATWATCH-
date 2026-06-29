-- Enums
CREATE TYPE user_role AS ENUM ('citizen', 'verified_reporter', 'moderator', 'admin');
CREATE TYPE issue_category AS ENUM ('pothole', 'water_leakage', 'streetlight', 'waste_management', 'infrastructure', 'other');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status AS ENUM ('reported', 'under_review', 'verified', 'in_progress', 'resolved', 'rejected', 'duplicate');

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT,
    role user_role DEFAULT 'citizen'::user_role NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    badge_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category issue_category NOT NULL,
    ai_category issue_category,
    severity issue_severity DEFAULT 'low'::issue_severity NOT NULL,
    status issue_status DEFAULT 'reported'::issue_status NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Issue media
CREATE TABLE issue_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Issue verifications
CREATE TABLE issue_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vote TEXT CHECK (vote IN ('confirm', 'dispute')) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(issue_id, user_id)
);

-- Issue status history
CREATE TABLE issue_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    old_status issue_status,
    new_status issue_status NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Issue comments
CREATE TABLE issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Points ledger
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    threshold_points INTEGER NOT NULL
);

-- Departments (Optional)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'citizen'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update issues.updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Issues RLS
CREATE POLICY "Issues are viewable by everyone." ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues." ON issues FOR INSERT WITH CHECK (auth.uid() = reporter_id);
-- Only reporter can update their own issue IF status is still 'reported', OR if user is moderator/admin
CREATE POLICY "Reporters can update own reported issues, admins can update any" ON issues FOR UPDATE USING (
  (auth.uid() = reporter_id AND status = 'reported'::issue_status) OR
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin')))
);

-- Issue Media RLS
CREATE POLICY "Issue media is viewable by everyone." ON issue_media FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert issue media." ON issue_media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Issue verifications RLS
CREATE POLICY "Verifications are viewable by everyone." ON issue_verifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create verifications." ON issue_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Issue status history RLS
CREATE POLICY "History is viewable by everyone." ON issue_status_history FOR SELECT USING (true);
CREATE POLICY "Only admins/moderators/system can insert history." ON issue_status_history FOR INSERT WITH CHECK (
  auth.uid() = changed_by AND
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin')))
);

-- Issue comments RLS
CREATE POLICY "Comments are viewable by everyone." ON issue_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments." ON issue_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points ledger RLS
CREATE POLICY "Points ledger viewable by everyone." ON points_ledger FOR SELECT USING (true);
-- Insert handled by system (e.g. edge functions / trigger)

-- Badges & Departments RLS
CREATE POLICY "Badges are viewable by everyone." ON badges FOR SELECT USING (true);
CREATE POLICY "Departments are viewable by everyone." ON departments FOR SELECT USING (true);
