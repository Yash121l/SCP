import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, FolderKanban, GraduationCap, UserRoundCheck } from "lucide-react";
import type { CurriculumDetail } from "@scp/contracts";
import { Badge, Panel } from "@scp/ui";
import { RecordTabs } from "../../../components/common/record-tabs.js";
import { apiGet } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";

const tabs = [
  { id: "stages", label: "Stages" },
  { id: "learners", label: "Students" },
  { id: "projects", label: "Projects" },
  { id: "operations", label: "Operations" },
];

function statusTone(status: string) {
  if (status === "completed") return "green" as const;
  if (status === "at_risk") return "amber" as const;
  if (status === "active" || status === "in_progress") return "blue" as const;
  return "neutral" as const;
}

export function CurriculumDetailView() {
  const { curriculumId } = useParams();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState("stages");
  const [curriculum, setCurriculum] = useState<CurriculumDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!curriculumId) {
      return;
    }

    void apiGet<{ curriculum: CurriculumDetail }>(`/api/curriculum/${curriculumId}`, session?.token)
      .then((payload) => {
        setCurriculum(payload.curriculum);
        setError(null);
      })
      .catch((unknownError) =>
        setError(unknownError instanceof Error ? unknownError.message : "Could not load curriculum"),
      );
  }, [curriculumId, session?.token]);

  if (error) {
    return <div className="loading-state">{error}</div>;
  }

  if (!curriculum) {
    return <div className="loading-state">Loading curriculum detail</div>;
  }

  const learners = curriculum.stages.flatMap((stage) =>
    stage.learners.map((learner) => ({ ...learner, stageTitle: stage.title })),
  );
  const projects = learners.filter((learner) => learner.projectId && learner.projectTitle);

  return (
    <div className="workspace-scroll">
      <section className="record-header">
        <Link className="record-back" to="/workspace/curriculum">
          <ArrowLeft size={13} />
          Curriculum
        </Link>
        <div className="record-title-row">
          <div className="record-avatar">
            <BookOpenCheck size={18} />
          </div>
          <div>
            <h1>{curriculum.moduleTitle}</h1>
            <p>
              {curriculum.moduleCode} · {curriculum.hubName} · {curriculum.gradeBand}
            </p>
          </div>
          <Badge tone={statusTone(curriculum.status)}>{curriculum.status.replace("_", " ")}</Badge>
        </div>
        <div className="metric-strip">
          <div>
            <span>Completion</span>
            <strong>{curriculum.completionPercent}%</strong>
          </div>
          <div>
            <span>Stages</span>
            <strong>{curriculum.stageCount}</strong>
          </div>
          <div>
            <span>Students</span>
            <strong>{curriculum.studentCount}</strong>
          </div>
          <div>
            <span>Projects</span>
            <strong>{curriculum.projectCount}</strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{curriculum.ownerEmployeeName ?? "Unassigned"}</strong>
          </div>
        </div>
      </section>

      <RecordTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === "stages" && (
        <section className="dashboard-grid">
          {curriculum.stages.map((stage) => (
            <Panel
              className="span-12 curriculum-stage-panel"
              key={stage.id}
              title={`${stage.sequence}. ${stage.title}`}
              action={<Badge tone={statusTone(stage.status)}>{stage.status.replace("_", " ")}</Badge>}
            >
              <div className="stage-summary">
                <div>
                  <span>Sessions</span>
                  <strong>{stage.completedSessions}/{stage.plannedSessions}</strong>
                </div>
                <div>
                  <span>Students</span>
                  <strong>{stage.studentCount}</strong>
                </div>
                <div>
                  <span>Projects</span>
                  <strong>{stage.projectCount}</strong>
                </div>
                <div>
                  <span>Next topic</span>
                  <strong>{stage.nextTopic}</strong>
                </div>
              </div>
              <div className="progress-track">
                <span style={{ width: `${stage.completionPercent}%` }} />
              </div>
            </Panel>
          ))}
        </section>
      )}

      {activeTab === "learners" && (
        <Panel title="Mapped students" className="span-12">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Stage</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => (
                  <tr key={learner.id}>
                    <td data-label="Student">
                      <Link to={`/workspace/students/${learner.studentId}`}>{learner.studentName}</Link>
                    </td>
                    <td data-label="Grade">{learner.studentGrade}</td>
                    <td data-label="Stage">{learner.stageTitle}</td>
                    <td data-label="Project">
                      {learner.projectId && learner.projectTitle ? (
                        <Link to={`/workspace/projects/${learner.projectId}`}>{learner.projectTitle}</Link>
                      ) : (
                        "Not mapped"
                      )}
                    </td>
                    <td data-label="Status">
                      <Badge tone={statusTone(learner.status)}>{learner.status.replace("_", " ")}</Badge>
                    </td>
                    <td data-label="Evidence">{learner.evidenceNote || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {activeTab === "projects" && (
        <Panel title="Linked projects" className="span-12">
          <div className="compact-list">
            {projects.map((project) => (
              <Link className="compact-row linked-row" key={`${project.id}-${project.projectId}`} to={`/workspace/projects/${project.projectId}`}>
                <FolderKanban size={15} />
                <div>
                  <strong>{project.projectTitle}</strong>
                  <span>{project.studentName} · {project.stageTitle}</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && <p className="empty-table-cell">No projects are mapped to this curriculum yet.</p>}
          </div>
        </Panel>
      )}

      {activeTab === "operations" && (
        <section className="dashboard-grid">
          <Panel className="span-7" title="Delivery scope">
            <div className="profile-list">
              <div>
                <BookOpenCheck size={16} />
                <span>{curriculum.domain}</span>
              </div>
              <div>
                <GraduationCap size={16} />
                <span>{curriculum.gradeBand}</span>
              </div>
              <div>
                <UserRoundCheck size={16} />
                <span>{curriculum.ownerEmployeeName ?? "Owner not assigned"}</span>
              </div>
            </div>
          </Panel>
          <Panel className="span-5" title="Next action">
            <div className="metric-stack">
              <div>
                <span>Next teaching topic</span>
                <strong>{curriculum.nextTopic}</strong>
              </div>
              <div>
                <span>Incubator</span>
                <strong>{curriculum.hubName}</strong>
              </div>
            </div>
          </Panel>
        </section>
      )}
    </div>
  );
}
