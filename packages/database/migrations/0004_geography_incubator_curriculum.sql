ALTER TABLE incubation_hubs
  ADD COLUMN IF NOT EXISTS latitude double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longitude double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geography_note text NOT NULL DEFAULT 'Geography pending',
  ADD COLUMN IF NOT EXISTS performance_score integer NOT NULL DEFAULT 0;

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS latitude double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longitude double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geography_note text NOT NULL DEFAULT 'Geography pending',
  ADD COLUMN IF NOT EXISTS performance_score integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  CREATE TYPE curriculum_delivery_status AS ENUM ('planned', 'active', 'at_risk', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE curriculum_learner_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS curriculum_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES incubation_hubs(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
  owner_employee_id uuid REFERENCES hub_employees(id) ON DELETE SET NULL,
  status curriculum_delivery_status NOT NULL DEFAULT 'planned',
  planned_sessions integer NOT NULL DEFAULT 0 CHECK (planned_sessions >= 0),
  completed_sessions integer NOT NULL DEFAULT 0 CHECK (completed_sessions >= 0),
  next_topic text NOT NULL DEFAULT 'Session planning pending',
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hub_id, module_id)
);

CREATE TABLE IF NOT EXISTS curriculum_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES curriculum_assignments(id) ON DELETE CASCADE,
  title text NOT NULL,
  sequence integer NOT NULL CHECK (sequence > 0),
  planned_sessions integer NOT NULL DEFAULT 0 CHECK (planned_sessions >= 0),
  completed_sessions integer NOT NULL DEFAULT 0 CHECK (completed_sessions >= 0),
  status curriculum_delivery_status NOT NULL DEFAULT 'planned',
  next_topic text NOT NULL DEFAULT 'Session planning pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, sequence)
);

CREATE TABLE IF NOT EXISTS curriculum_stage_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES curriculum_stages(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  project_id uuid REFERENCES student_projects(id) ON DELETE SET NULL,
  status curriculum_learner_status NOT NULL DEFAULT 'not_started',
  evidence_note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, student_id)
);

CREATE INDEX IF NOT EXISTS curriculum_assignments_hub_idx ON curriculum_assignments(hub_id);
CREATE INDEX IF NOT EXISTS curriculum_stages_assignment_idx ON curriculum_stages(assignment_id);
CREATE INDEX IF NOT EXISTS curriculum_stage_students_student_idx ON curriculum_stage_students(student_id);
CREATE INDEX IF NOT EXISTS curriculum_stage_students_project_idx ON curriculum_stage_students(project_id);
