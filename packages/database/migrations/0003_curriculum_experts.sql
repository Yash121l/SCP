ALTER TYPE organization_type ADD VALUE IF NOT EXISTS 'partner';

DO $$ BEGIN
  CREATE TYPE expert_status AS ENUM ('active', 'invited', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS curriculum_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  domain text NOT NULL,
  grade_band text NOT NULL,
  session_count integer NOT NULL DEFAULT 0 CHECK (session_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curriculum_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES incubation_hubs(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
  planned_sessions integer NOT NULL DEFAULT 0 CHECK (planned_sessions >= 0),
  completed_sessions integer NOT NULL DEFAULT 0 CHECK (completed_sessions >= 0),
  next_topic text NOT NULL DEFAULT 'Session planning pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, module_id)
);

CREATE TABLE IF NOT EXISTS external_experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  organization text NOT NULL,
  focus_area text NOT NULL,
  status expert_status NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT external_experts_email_lowercase CHECK (email = lower(email))
);

CREATE TABLE IF NOT EXISTS project_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
  expert_id uuid REFERENCES external_experts(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  expert_name text NOT NULL,
  expert_organization text NOT NULL,
  rating integer NOT NULL DEFAULT 3 CHECK (rating BETWEEN 1 AND 5),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS curriculum_progress_hub_idx ON curriculum_progress(hub_id);
CREATE INDEX IF NOT EXISTS curriculum_progress_institution_idx ON curriculum_progress(institution_id);
CREATE INDEX IF NOT EXISTS external_experts_status_idx ON external_experts(status);
CREATE INDEX IF NOT EXISTS project_feedback_project_idx ON project_feedback(project_id);
CREATE INDEX IF NOT EXISTS project_feedback_created_at_idx ON project_feedback(created_at DESC);
