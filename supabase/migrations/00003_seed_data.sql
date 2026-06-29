-- Seed Profiles (Fictional Users)
-- We need to bypass the auth.users foreign key for seed data, 
-- or we can just insert fake UUIDs and hope the foreign key is deferred (it's not).
-- Since auth.users is managed by Supabase, the best way to seed issues is to insert 
-- a fake user into auth.users first if allowed, or just let reporter_id be NULL for seeded issues.
-- For simplicity in a remote DB without auth access, we'll insert issues with reporter_id = NULL
-- but we can insert profiles by creating a fake auth user if we use the service role, but in SQL editor we might not have permission to auth.users.
-- Let's just create issues with reporter_id = NULL for the seed data so they show up on the map.

INSERT INTO public.issues (title, description, category, severity, status, lat, lng, created_at)
VALUES 
('Massive pothole on Main St', 'Dangerous pothole near the intersection, cars are swerving.', 'pothole', 'high', 'reported', 28.6139, 77.2090, NOW() - INTERVAL '2 days'),
('Water leaking from pipe', 'Clean water is gushing out of the pavement.', 'water_leakage', 'critical', 'verified', 28.6239, 77.2190, NOW() - INTERVAL '1 day'),
('Streetlight not working', 'Pitch dark at night, safety hazard.', 'streetlight', 'medium', 'under_review', 28.6039, 77.1990, NOW() - INTERVAL '3 days'),
('Garbage dumped in park', 'Construction waste dumped overnight.', 'waste_management', 'medium', 'in_progress', 28.6339, 77.2290, NOW() - INTERVAL '5 days'),
('Broken bench', 'Park bench is completely destroyed.', 'infrastructure', 'low', 'resolved', 28.6189, 77.2140, NOW() - INTERVAL '10 days'),
('Clogged drain', 'Water logging after minor rain.', 'water_leakage', 'high', 'reported', 28.6100, 77.2000, NOW() - INTERVAL '1 hour');

-- Let's insert a fake user profile if we can bypass the FK, but since it's ON DELETE CASCADE referencing auth.users, we might get a constraint violation.
-- So we'll skip seeding profiles and just use the ones created when the user signs up!
