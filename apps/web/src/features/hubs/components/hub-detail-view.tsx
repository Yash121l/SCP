import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, GraduationCap, Users } from "lucide-react";
import { userHasPermission, type HubDetail } from "@scp/contracts";
import { Panel } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { RecordTabs } from "../../../components/common/record-tabs.js";
import { HubStatusBadge, StudentStatusBadge } from "../../../components/common/status-badge.js";
import { apiDelete, apiGet, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { InstitutionsTable } from "../../institutions/components/institutions-table.js";
import { useWorkspaceDataState } from "../../workspace/workspace-data.js";

const hubEditFields: EditSheetField[] = [
  { label: "Name", name: "name", required: true },
  { label: "Code", name: "code", required: true },
  { label: "Region", name: "region", required: true },
  { label: "District", name: "district", required: true },
  {
    label: "Status",
    name: "status",
    options: [
      { label: "Active", value: "active" },
      { label: "Onboarding", value: "onboarding" },
      { label: "Attention", value: "attention" },
      { label: "Archived", value: "archived" },
    ],
    required: true,
    type: "select",
  },
  { label: "Latitude", max: 90, min: -90, name: "latitude", type: "number" },
  { label: "Longitude", max: 180, min: -180, name: "longitude", type: "number" },
  { label: "Performance score", max: 100, min: 0, name: "performanceScore", type: "number" },
  { label: "Geography note", name: "geographyNote", type: "textarea" },
];

function hubEditValues(hub: HubDetail) {
  return {
    code: hub.code,
    district: hub.district,
    geographyNote: hub.geographyNote,
    latitude: hub.latitude,
    longitude: hub.longitude,
    name: hub.name,
    performanceScore: hub.performanceScore,
    region: hub.region,
    status: hub.status,
  };
}

export function HubDetailView() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { hubId } = useParams();
  const { refresh } = useWorkspaceDataState();
  const [hub, setHub] = useState<HubDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("schools");
  const canManage = session ? userHasPermission(session.user, "hubs:manage") : false;

  useEffect(() => {
    if (!hubId) {
      return;
    }

    void apiGet<{ hub: HubDetail }>(`/api/hubs/${hubId}`, session?.token)
      .then((payload) => {
        setHub(payload.hub);
        setError(null);
      })
      .catch((unknownError) => setError(unknownError instanceof Error ? unknownError.message : "Could not load incubator"));
  }, [hubId, session?.token]);

  if (error) {
    return <div className="loading-state">{error}</div>;
  }

  if (!hub) {
    return <div className="loading-state">Loading incubator detail</div>;
  }

  async function saveHub(values: Record<string, string | number | null | undefined>) {
    if (!hub) {
      return;
    }

    const payload = await apiPatch<{ hub: HubDetail }>(`/api/hubs/${hub.id}`, values, session?.token);
    setHub((current) => (current ? { ...current, ...payload.hub } : payload.hub));
    setEditing(false);
    await refresh();
  }

  async function archiveHub() {
    if (!hub || !window.confirm(`Archive ${hub.name}?`)) {
      return;
    }

    await apiDelete(`/api/hubs/${hub.id}`, session?.token);
    await refresh();
    navigate("/workspace/hubs");
  }

  return (
    <div className="workspace-scroll">
      <section className="record-header">
        <Link className="record-back" to="/workspace/hubs">
          <ArrowLeft size={13} />
          Incubators
        </Link>
        <div className="record-title-row">
          <div className="record-avatar">{hub.name.charAt(0)}</div>
          <div>
            <h1>{hub.name}</h1>
            <p>
              {hub.code} · {hub.region} · {hub.district}
            </p>
          </div>
          <div className="record-title-actions">
            <HubStatusBadge status={hub.status} />
            <ActionMenu
              canDelete={canManage}
              canEdit={canManage}
              deleteLabel="Archive incubator"
              onDelete={() => void archiveHub()}
              onEdit={() => setEditing(true)}
            />
          </div>
        </div>
        <div className="metric-strip">
          <div>
            <span>Schools</span>
            <strong>{hub.institutionCount}</strong>
          </div>
          <div>
            <span>Employees</span>
            <strong>{hub.employeeCount}</strong>
          </div>
          <div>
            <span>Students</span>
            <strong>{hub.studentCount.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span>Operating Zone</span>
            <strong>{hub.region}</strong>
          </div>
        </div>
      </section>

      <RecordTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "schools", label: "Schools" },
          { id: "employees", label: "Employees" },
          { id: "students", label: "Students" },
          { id: "geography", label: "Geography" },
        ]}
      />

      <section className="dashboard-grid">
        {activeTab === "schools" && (
          <Panel className="span-12" title="Mapped schools" action={<Building2 size={16} />}>
            <InstitutionsTable institutions={hub.institutions} />
          </Panel>
        )}

        {activeTab === "employees" && (
          <Panel className="span-12" title="Incubator employees" action={<Users size={16} />}>
            <div className="compact-list">
              {hub.employees.map((employee) => (
                <div className="compact-row" key={employee.id}>
                  <div>
                    <strong>{employee.name}</strong>
                    <span>
                      {employee.designation} · {employee.institutionName ?? "Incubator level"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {activeTab === "students" && (
          <Panel className="span-12" title="Students in incubator" action={<GraduationCap size={16} />}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>School</th>
                    <th>Grade</th>
                    <th>Projects</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hub.students.map((student) => (
                    <tr key={student.id}>
                      <td data-label="Name">
                        <Link to={`/workspace/students/${student.id}`}>{student.name}</Link>
                      </td>
                      <td data-label="School">{student.institutionName}</td>
                      <td data-label="Grade">{student.grade}</td>
                      <td data-label="Projects">{student.projectCount}</td>
                      <td data-label="Status">
                        <StudentStatusBadge status={student.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {activeTab === "geography" && (
          <Panel className="span-12" title="Geography and performance">
            <div className="detail-band">
              <div>
                <span>Coordinates</span>
                <strong>{hub.latitude.toFixed(4)}, {hub.longitude.toFixed(4)}</strong>
              </div>
              <div>
                <span>Performance score</span>
                <strong>{hub.performanceScore}/100</strong>
              </div>
              <div>
                <span>Map note</span>
                <strong>{hub.geographyNote}</strong>
              </div>
            </div>
          </Panel>
        )}
      </section>
      {editing && (
        <EditSheet
          description="Update incubator ownership, geography and operating status."
          fields={hubEditFields}
          initialValues={hubEditValues(hub)}
          onClose={() => setEditing(false)}
          onSubmit={saveHub}
          title={`Edit ${hub.name}`}
        />
      )}
    </div>
  );
}
