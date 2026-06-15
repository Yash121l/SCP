DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'proposed',
    'under_review',
    'approved',
    'in_progress',
    'on_hold',
    'completed',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS student_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES incubation_hubs(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  approval_id uuid REFERENCES approvals(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  domain text NOT NULL,
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  problem_statement text NOT NULL,
  solution_summary text NOT NULL,
  status project_status NOT NULL DEFAULT 'proposed',
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_projects_hub_idx ON student_projects(hub_id);
CREATE INDEX IF NOT EXISTS student_projects_institution_idx ON student_projects(institution_id);
CREATE INDEX IF NOT EXISTS student_projects_student_idx ON student_projects(student_id);
CREATE INDEX IF NOT EXISTS student_projects_status_idx ON student_projects(status);
CREATE INDEX IF NOT EXISTS student_projects_created_at_idx ON student_projects(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS student_projects_unique_idx ON student_projects(title, institution_id, owner_email);
