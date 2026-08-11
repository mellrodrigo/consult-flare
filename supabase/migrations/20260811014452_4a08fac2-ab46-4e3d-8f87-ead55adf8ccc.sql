CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_self_write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('CONTRATACAO','NTT')),
  title text NOT NULL,
  current_stage text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','done','rejected')),
  cand_name text,
  cand_email text,
  cand_phone text,
  cand_linkedin text,
  role text,
  manager text,
  area text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cases_all" ON public.cases FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  outcome text,
  note text,
  author uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.stage_history TO authenticated;
GRANT ALL ON public.stage_history TO service_role;
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_all" ON public.stage_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_history_case ON public.stage_history(case_id);

CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  kind text,
  scheduled_at timestamptz,
  location text,
  interviewer text,
  result text NOT NULL DEFAULT 'pendente' CHECK (result IN ('pendente','aprovado','reprovado')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interviews_all" ON public.interviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_interviews_case ON public.interviews(case_id);

CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'other',
  original_name text NOT NULL,
  storage_path text NOT NULL,
  mime text,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_all" ON public.attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_attachments_case ON public.attachments(case_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER cases_touch BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "workflow_files_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'workflow-files');
CREATE POLICY "workflow_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'workflow-files');
CREATE POLICY "workflow_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'workflow-files');