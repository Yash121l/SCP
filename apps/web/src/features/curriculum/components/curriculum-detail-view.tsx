import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, FolderKanban, GraduationCap, UserRoundCheck } from "lucide-react";
import {
  userHasPermission,
  type CurriculumDetail,
  type CurriculumStage,
  type CurriculumStageLearner,
} from "@scp/contracts";
import { Badge, Panel } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { RecordTabs } from "../../../components/common/record-tabs.js";
import { apiGet, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

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

const deliveryStatusOptions = [
  { label: "Planned", value: "planned" },
  { label: "Active", value: "active" },
  { label: "At risk", value: "at_risk" },
  { label: "Completed", value: "completed" },
];

const learnerStatusOptions = [
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

type LearnerWithStage = CurriculumStageLearner & {
  stageTitle: string;
};

function assignmentValues(curriculum: CurriculumDetail) {
  return {
    completedSessions: curriculum.completedSessions,
    nextTopic: curriculum.nextTopic,
    ownerEmployeeId: curriculum.ownerEmployeeId,
    plannedSessions: curriculum.plannedSessions,
    status: curriculum.status,
  };
}

function learnerValues(learner: CurriculumStageLearner) {
  return {
    evidenceNote: learner.evidenceNote,
    projectId: learner.projectId,
    status: learner.status,
  };
}

function stageValues(stage: CurriculumStage) {
  return {
    completedSessions: stage.completedSessions,
    detail: stage.detail,
    attachmentUrl: stage.attachmentUrl,
    nextTopic: stage.nextTopic,
    plannedSessions: stage.plannedSessions,
    sequence: stage.sequence,
    status: stage.status,
    title: stage.title,
  };
}

export function CurriculumDetailView() {
  const { curriculumId } = useParams();
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { employees, projects: projectRows } = useWorkspaceSummary();
  const [activeTab, setActiveTab] = useState("stages");
  const [curriculum, setCurriculum] = useState<CurriculumDetail | null>(null);
  const [editingAssignment, setEditingAssignment] = useState(false);
  const [editingLearner, setEditingLearner] = useState<LearnerWithStage | null>(null);
  const [editingStage, setEditingStage] = useState<CurriculumStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = session ? userHasPermission(session.user, "curriculum:manage") : false;

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

  const currentCurriculum = curriculum;
  const learners = currentCurriculum.stages.flatMap((stage) =>
    stage.learners.map((learner) => ({ ...learner, stageTitle: stage.title })),
  );
  const assignmentFields: EditSheetField[] = [
    {
      label: "Owner",
      name: "ownerEmployeeId",
      options: employees
        .filter((employee) => employee.hubId === currentCurriculum.hubId)
        .map((employee) => ({ label: `${employee.name} · ${employee.designation}`, value: employee.id })),
      type: "select",
    },
    {
      label: "Status",
      name: "status",
      options: deliveryStatusOptions,
      required: true,
      type: "select",
    },
    { label: "Planned sessions", min: 0, name: "plannedSessions", required: true, type: "number" },
    {
      label: "Completed sessions",
      max: currentCurriculum.plannedSessions,
      min: 0,
      name: "completedSessions",
      required: true,
      type: "number",
    },
    { label: "Next topic", maxLength: 240, name: "nextTopic", required: true, type: "textarea" },
  ];
  const learnerFields: EditSheetField[] = [
    {
      label: "Status",
      name: "status",
      options: learnerStatusOptions,
      required: true,
      type: "select",
    },
    {
      label: "Linked project",
      name: "projectId",
      options: projectRows
        .filter((project) => project.studentId === editingLearner?.studentId)
        .map((project) => ({ label: project.title, value: project.id })),
      type: "select",
    },
    { label: "Evidence note", maxLength: 500, name: "evidenceNote", type: "textarea" },
  ];
  const linkedProjects = learners.filter((learner) => learner.projectId && learner.projectTitle);
  const stageFields: EditSheetField[] = [
    { label: "Stage title", maxLength: 160, name: "title", required: true },
    { label: "Sequence order", min: 1, name: "sequence", required: true, type: "number" },
    {
      label: "Status",
      name: "status",
      options: deliveryStatusOptions,
      required: true,
      type: "select",
    },
    { label: "Planned sessions", min: 0, name: "plannedSessions", required: true, type: "number" },
    {
      label: "Completed sessions",
      max: editingStage?.plannedSessions,
      min: 0,
      name: "completedSessions",
      required: true,
      type: "number",
    },
    { label: "Detail notes", maxLength: 1000, name: "detail", type: "textarea" },
    { label: "Attachment URL", name: "attachmentUrl", type: "text", placeholder: "https://drive.google.com/..." },
    { label: "Next topic", maxLength: 240, name: "nextTopic", required: true, type: "textarea" },
  ];

  async function saveAssignment(values: Record<string, string | number | null | undefined>) {
    const payload = await apiPatch<{ curriculum: CurriculumDetail }>(
      `/api/curriculum/${currentCurriculum.id}`,
      {
        ...values,
        ownerEmployeeId: values.ownerEmployeeId ?? null,
      },
      session?.token,
    );
    setCurriculum(payload.curriculum);
    setEditingAssignment(false);
    await refresh();
  }

  async function saveLearner(values: Record<string, string | number | null | undefined>) {
    if (!editingLearner) {
      return;
    }

    const payload = await apiPatch<{ curriculum: CurriculumDetail }>(
      `/api/curriculum/learners/${editingLearner.id}`,
      {
        ...values,
        projectId: values.projectId ?? null,
      },
      session?.token,
    );
    setCurriculum(payload.curriculum);
    setEditingLearner(null);
    await refresh();
  }

  async function saveStage(values: Record<string, string | number | null | undefined>) {
    if (!editingStage) {
      return;
    }

    const payload = await apiPatch<{ curriculum: CurriculumDetail }>(
      `/api/curriculum/stages/${editingStage.id}`,
      values,
      session?.token,
    );
    setCurriculum(payload.curriculum);
    setEditingStage(null);
    await refresh();
  }

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
          <div className="record-title-actions">
            <Badge tone={statusTone(curriculum.status)}>{curriculum.status.replace("_", " ")}</Badge>
            <ActionMenu
              canEdit={canManage}
              editLabel="Edit delivery"
              onEdit={() => setEditingAssignment(true)}
            />
          </div>
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
              action={
                <div className="record-title-actions">
                  <Badge tone={statusTone(stage.status)}>{stage.status.replace("_", " ")}</Badge>
                  <ActionMenu
                    canEdit={canManage}
                    editLabel="Edit stage"
                    onEdit={() => setEditingStage(stage)}
                  />
                </div>
              }
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
                {stage.detail && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Detail note</span>
                    <strong>{stage.detail}</strong>
                  </div>
                )}
                {stage.attachmentUrl && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Attachment</span>
                    <strong><a href={stage.attachmentUrl} target="_blank" rel="noreferrer">View attached material</a></strong>
                  </div>
                )}
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
                  {canManage && <th>Actions</th>}
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
                    {canManage && (
                      <td data-label="Actions">
                        <ActionMenu
                          canEdit
                          editLabel="Update evidence"
                          onEdit={() => setEditingLearner(learner)}
                        />
                      </td>
                    )}
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
            {linkedProjects.map((project) => (
              <Link className="compact-row linked-row" key={`${project.id}-${project.projectId}`} to={`/workspace/projects/${project.projectId}`}>
                <FolderKanban size={15} />
                <div>
                  <strong>{project.projectTitle}</strong>
                  <span>{project.studentName} · {project.stageTitle}</span>
                </div>
              </Link>
            ))}
            {linkedProjects.length === 0 && <p className="empty-table-cell">No projects are mapped to this curriculum yet.</p>}
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
      {editingAssignment && (
        <EditSheet
          description="Update delivery owner, status, session progress and the next teaching topic."
          fields={assignmentFields}
          initialValues={assignmentValues(curriculum)}
          onClose={() => setEditingAssignment(false)}
          onSubmit={saveAssignment}
          title={`Edit ${curriculum.moduleCode} delivery`}
        />
      )}
      {editingLearner && (
        <EditSheet
          description={`${editingLearner.studentName} · ${editingLearner.stageTitle}`}
          fields={learnerFields}
          initialValues={learnerValues(editingLearner)}
          onClose={() => setEditingLearner(null)}
          onSubmit={saveLearner}
          title="Update learner evidence"
        />
      )}
      {editingStage && (
        <EditSheet
          description="Update stage progress, delivery status and next topic."
          fields={stageFields}
          initialValues={stageValues(editingStage)}
          onClose={() => setEditingStage(null)}
          onSubmit={saveStage}
          title={`Edit ${editingStage.title}`}
        />
      )}
    </div>
  );
}
