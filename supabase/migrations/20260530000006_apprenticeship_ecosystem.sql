-- 20260530000006_apprenticeship_ecosystem.sql
-- APPRENTICESHIP & TRAINING ECOSYSTEM

-- 1. Create Apprenticeships Table
CREATE TABLE IF NOT EXISTS public.apprenticeships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    learner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if still looking
    training_id UUID, -- Optional link to a training course/listing
    title TEXT NOT NULL,
    description TEXT,
    skill_area TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.apprenticeships ENABLE ROW LEVEL SECURITY;

-- 2. Create Apprenticeship Applications
CREATE TABLE IF NOT EXISTS public.apprenticeship_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    apprenticeship_id UUID REFERENCES public.apprenticeships(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(apprenticeship_id, applicant_id)
);

ALTER TABLE public.apprenticeship_applications ENABLE ROW LEVEL SECURITY;

-- 3. Create Progress Tracking
CREATE TABLE IF NOT EXISTS public.apprenticeship_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    apprenticeship_id UUID REFERENCES public.apprenticeships(id) ON DELETE CASCADE NOT NULL,
    learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    milestone_title TEXT NOT NULL,
    description TEXT,
    completion_status BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    "order" INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.apprenticeship_progress ENABLE ROW LEVEL SECURITY;

-- 4. Create Certifications
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    apprenticeship_id UUID REFERENCES public.apprenticeships(id) ON DELETE CASCADE NOT NULL,
    learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    certificate_title TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verification_code TEXT DEFAULT upper(substring(md5(random()::text), 1, 8)) NOT NULL,
    UNIQUE(apprenticeship_id, learner_id)
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- 5. LOGIC: MENTORSHIP & PROGRESSION

-- Ensure only Hustlers or Agents can be mentors
CREATE OR REPLACE FUNCTION public.validate_mentor_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.mentor_id 
        AND (role = 'hustler' OR is_verified = true OR is_agent = true)
    ) THEN
        RAISE EXCEPTION 'Only verified Hustlers or Agents can create apprenticeship programs.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_mentor_status
    BEFORE INSERT ON public.apprenticeships
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_mentor_status();

-- Handle application acceptance
CREATE OR REPLACE FUNCTION public.handle_apprenticeship_application()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Link learner to apprenticeship
        UPDATE public.apprenticeships
        SET learner_id = NEW.applicant_id,
            status = 'active',
            start_date = now()
        WHERE id = NEW.apprenticeship_id;

        -- Reject other applications for the same spot (one-to-one for now)
        UPDATE public.apprenticeship_applications
        SET status = 'rejected'
        WHERE apprenticeship_id = NEW.apprenticeship_id 
        AND id <> NEW.id;

        -- Create notification
        PERFORM public.create_notification(
            NEW.applicant_id,
            (SELECT mentor_id FROM public.apprenticeships WHERE id = NEW.apprenticeship_id),
            'apprenticeship_accepted',
            NEW.apprenticeship_id,
            'apprenticeship',
            'Your apprenticeship application was accepted!'
        );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        -- Create notification
        PERFORM public.create_notification(
            NEW.applicant_id,
            (SELECT mentor_id FROM public.apprenticeships WHERE id = NEW.apprenticeship_id),
            'apprenticeship_rejected',
            NEW.apprenticeship_id,
            'apprenticeship',
            'Your apprenticeship application was declined.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_apprenticeship_application
    AFTER UPDATE OF status ON public.apprenticeship_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_apprenticeship_application();

-- Automated Certification on Completion
CREATE OR REPLACE FUNCTION public.auto_issue_certification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'active' THEN
        INSERT INTO public.certifications (apprenticeship_id, learner_id, certificate_title)
        VALUES (NEW.id, NEW.learner_id, NEW.title);

        PERFORM public.create_notification(
            NEW.learner_id,
            NEW.mentor_id,
            'certification_issued',
            NEW.id,
            'certification',
            'Congratulations! Your certification for ' || NEW.title || ' has been issued.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_issue_certification
    AFTER UPDATE OF status ON public.apprenticeships
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_issue_certification();

-- 6. SECURITY RULES (RLS)

-- Apprenticeships
CREATE POLICY "Anyone can view apprenticeships" ON public.apprenticeships
    FOR SELECT USING (true);

CREATE POLICY "Mentors manage their programs" ON public.apprenticeships
    FOR ALL USING (auth.uid() = mentor_id);

-- Applications
CREATE POLICY "Mentors can see applications to their programs" ON public.apprenticeship_applications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.apprenticeships WHERE id = apprenticeship_id AND mentor_id = auth.uid())
    );

CREATE POLICY "Applicants can see their own applications" ON public.apprenticeship_applications
    FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Users can apply" ON public.apprenticeship_applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Mentors update application status" ON public.apprenticeship_applications
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.apprenticeships WHERE id = apprenticeship_id AND mentor_id = auth.uid())
    );

-- Progress
CREATE POLICY "Mentors and learners see progress" ON public.apprenticeship_progress
    FOR SELECT USING (
        auth.uid() = learner_id OR 
        EXISTS (SELECT 1 FROM public.apprenticeships WHERE id = apprenticeship_id AND mentor_id = auth.uid())
    );

CREATE POLICY "Mentors manage milestones" ON public.apprenticeship_progress
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.apprenticeships WHERE id = apprenticeship_id AND mentor_id = auth.uid())
    );

CREATE POLICY "Learners update completion status" ON public.apprenticeship_progress
    FOR UPDATE USING (auth.uid() = learner_id)
    WITH CHECK (completion_status IS NOT NULL);

-- Certifications
CREATE POLICY "Certifications are public" ON public.certifications
    FOR SELECT USING (true);

-- No one manually inserts/updates certifications (handled by trigger)
