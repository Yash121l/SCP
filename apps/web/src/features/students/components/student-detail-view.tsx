import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, GraduationCap, Network, UserRoundCheck } from "lucide-react";
import { userHasPermission, type StudentDetail } from "@scp/contracts";
import { Panel } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { RecordTabs } from "../../../components/common/record-tabs.js";
import { StudentStatusBadge } from "../../../components/common/status-badge.js";
import { apiDelete, apiGet, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function StudentDetailView() {
  const { session } = useAuth();
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useWorkspaceDataState();
  const { employees, institutions } = useWorkspaceSummary();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("learning");
  const [editingStudent, setEditingStudent] = useState<StudentDetail | null>(null);
  const canManage = session ? userHasPermission(session.user, "students:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "Name", name: "name", required: true },
    { label: "Email", name: "email", required: true, type: "email" },
    { label: "Grade", name: "grade", required: true },
    {
      label: "School",
      name: "institutionId",
      options: institutions.map((institution) => ({ label: institution.name, value: institution.id })),
      required: true,
      type: "select",
    },
    {
      label: "Mentor",
      name: "mentorEmployeeId",
      options: employees.map((employee) => ({ label: `${employee.name} · ${employee.designation}`, value: employee.id })),
      type: "select",
    },
    {
      label: "Status",
      name: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Graduated", value: "graduated" },
      ],
      required: true,
      type: "select",
    },
    { label: "Projects", min: 0, name: "projectCount", type: "number" },
  ];

  useEffect(() => {
    if (!studentId) {
      return;
    }

    void apiGet<{ student: StudentDetail }>(`/api/students/${studentId}`, session?.token)
      .then((payload) => {
        setStudent(payload.student);
        setError(null);
      })
      .catch((unknownError) => setError(unknownError instanceof Error ? unknownError.message : "Could not load student"));
  }, [studentId, session?.token]);

  if (error) {
    return <div className="loading-state">{error}</div>;
  }

  if (!student) {
    return <div className="loading-state">Loading student detail</div>;
  }

  async function saveStudent(values: Record<string, string | number | null | undefined>) {
    if (!editingStudent) {
      return;
    }

    const payload = await apiPatch<{ student: StudentDetail }>(
      `/api/students/${editingStudent.id}`,
      {
        ...values,
        mentorEmployeeId: values.mentorEmployeeId === undefined ? null : values.mentorEmployeeId,
      },
      session?.token,
    );
    setStudent(payload.student);
    setEditingStudent(null);
    await refresh();
  }

  async function deleteStudent() {
    if (!student || !window.confirm(`Delete ${student.name}?`)) {
      return;
    }

    await apiDelete(`/api/students/${student.id}`, session?.token);
    await refresh();
    navigate("/workspace/students");
  }

  return (
    <div className="workspace-scroll">
      <section className="record-header">
        <Link className="record-back" to="/workspace/students">
          <ArrowLeft size={13} />
          Students
        </Link>
        <div className="record-title-row">
          <div className="record-avatar">{student.name.charAt(0)}</div>
          <div>
            <h1>{student.name}</h1>
            <p>
              {student.grade} · {student.institutionName} · {student.hubName}
            </p>
          </div>
          <div className="record-title-actions">
            <StudentStatusBadge status={student.status} />
            {canManage && (
              <ActionMenu
                canDelete
                canEdit
                onDelete={() => void deleteStudent()}
                onEdit={() => setEditingStudent(student)}
              />
            )}
          </div>
        </div>
        <div className="metric-strip">
          <div>
            <span>Projects</span>
            <strong>{student.projectCount}</strong>
          </div>
          <div>
            <span>School</span>
            <strong>{student.institutionName}</strong>
          </div>
          <div>
            <span>Mentor</span>
            <strong>{student.mentorName ?? "Unassigned"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{student.email}</strong>
          </div>
        </div>
      </section>

      <RecordTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "learning", label: "Learning Scope" },
          { id: "record", label: "Record" },
        ]}
      />

      <section className="dashboard-grid">
        {activeTab === "learning" && (
          <Panel className="span-12" title="Learning scope">
            <div className="profile-list">
              <div>
                <Network size={16} />
                <Link to={`/workspace/hubs/${student.hubId}`}>Incubator: {student.hubName}</Link>
              </div>
              <div>
                <Building2 size={16} />
                <Link to={`/workspace/institutions/${student.institutionId}`}>School: {student.institutionName}</Link>
              </div>
              <div>
                <UserRoundCheck size={16} />
                <span>{student.mentorName ?? "Mentor not assigned"}</span>
              </div>
            </div>
          </Panel>
        )}

        {activeTab === "record" && (
          <Panel className="span-12" title="Student record">
            <div className="metric-stack">
              <div>
                <span>Grade</span>
                <strong>{student.grade}</strong>
              </div>
              <div>
                <span>Student ID</span>
                <strong>{student.id.slice(0, 8)}</strong>
              </div>
              <div>
                <span>Workspace</span>
                <strong>
                  <GraduationCap size={16} />
                  Student
                </strong>
              </div>
            </div>
          </Panel>
        )}
      </section>
      {editingStudent && (
        <EditSheet
          description="Update student placement, grade, mentor, status and project load."
          fields={editFields}
          initialValues={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSubmit={saveStudent}
          title={`Edit ${editingStudent.name}`}
        />
      )}
    </div>
  );
}
