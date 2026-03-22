
-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_attendees table
CREATE TABLE public.meeting_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  UNIQUE(meeting_id, member_id)
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  votes_abstain INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question_votes table (tracks who voted, NOT how - secret ballot)
CREATE TABLE public.question_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  UNIQUE(question_id, member_id)
);

-- Enable RLS on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_votes ENABLE ROW LEVEL SECURITY;

-- Public access policies (PIN-based auth, no Supabase auth)
CREATE POLICY "Allow public read members" ON public.members FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert members" ON public.members FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update members" ON public.members FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow public delete members" ON public.members FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read meetings" ON public.meetings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert meetings" ON public.meetings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update meetings" ON public.meetings FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow public delete meetings" ON public.meetings FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read meeting_attendees" ON public.meeting_attendees FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert meeting_attendees" ON public.meeting_attendees FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public delete meeting_attendees" ON public.meeting_attendees FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read questions" ON public.questions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert questions" ON public.questions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update questions" ON public.questions FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow public delete questions" ON public.questions FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read question_votes" ON public.question_votes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert question_votes" ON public.question_votes FOR INSERT TO anon WITH CHECK (true);

-- Atomic vote function (secret ballot: records WHO voted but not HOW)
CREATE OR REPLACE FUNCTION public.cast_vote(
  p_question_id UUID,
  p_member_id UUID,
  p_vote_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM question_votes WHERE question_id = p_question_id AND member_id = p_member_id) THEN
    RETURN FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE id = p_question_id AND status = 'voting') THEN
    RETURN FALSE;
  END IF;
  INSERT INTO question_votes (question_id, member_id) VALUES (p_question_id, p_member_id);
  IF p_vote_type = 'for' THEN
    UPDATE questions SET votes_for = votes_for + 1 WHERE id = p_question_id;
  ELSIF p_vote_type = 'against' THEN
    UPDATE questions SET votes_against = votes_against + 1 WHERE id = p_question_id;
  ELSIF p_vote_type = 'abstain' THEN
    UPDATE questions SET votes_abstain = votes_abstain + 1 WHERE id = p_question_id;
  ELSE
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$;
