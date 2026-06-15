import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Users } from "lucide-react";
import { userHasPermission, type InstitutionDetail } from "@scp/contracts";
import { Panel } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { RecordTabs } from "../../../components/common/record-tabs.js";
import { InstitutionStatusBadge } from "../../../components/common/status-badge.js";
import { apiDelete, apiGet, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

function institutionEditValues(institution: InstitutionDetail) {
  return {
    address: institution.address,
    code: institution.code,
    contactEmail: institution.contactEmail,
    district: institution.district,
    geographyNote: institution.geographyNote,
    hubId: institution.hubId,
    latitude: institution.latitude,
    longitude: institution.longitude,
    name: institution.name,
    performanceScore: institution.performanceScore,
    principalName: institution.principalName,
    projectCount: institution.projectCount,
    region: institution.region,
    status: institution.status,
    studentCount: institution.studentCount,
    type: institution.type,
  };
}

export function InstitutionDetailView() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const { refresh } = useWorkspaceDataState();
  const { hubs } = useWorkspaceSummary();
  const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const canManage = session ? userHasPermission(session.user, "institutions:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "School name", name: "name", required: true },
    { label: "Code", name: "code" },
    {
      label: "Incubator",
      name: "hubId",
      options: hubs.map((hub) => ({ label: hub.name, value: hub.id })),
      required: true,
      type: "select",
    },
    {
      label: "Type",
      name: "type",
      options: [
        { label: "School", value: "school" },
        { label: "College", value: "college" },
        { label: "Polytechnic", value: "polytechnic" },
        { label: "ITI", value: "iti" },
      ],
      required: true,
      type: "select",
    },
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
    { label: "Region", name: "region", required: true },
    { label: "District", name: "district", required: true },
    { label: "Address", name: "address", type: "textarea" },
    { label: "Principal", name: "principalName", required: true },
    { label: "Contact email", name: "contactEmail", required: true, type: "email" },
    { label: "Latitude", max: 90, min: -90, name: "latitude", type: "number" },
    { label: "Longitude", max: 180, min: -180, name: "longitude", type: "number" },
    { label: "Performance score", max: 100, min: 0, name: "performanceScore", type: "number" },
    { label: "Students", min: 0, name: "studentCount", type: "number" },
    { label: "Projects", min: 0, name: "projectCount", type: "number" },
    { label: "Geography note", name: "geographyNote", type: "textarea" },
  ];

  useEffect(() => {
    if (!institutionId) {
      return;
    }

    void apiGet<{ institution: InstitutionDetail }>(`/api/institutions/${institutionId}`, session?.token)
      .then((payload) => {
        setInstitution(payload.institution);
        setError(null);
      })
      .catch((unknownError) =>
        setError(unknownError instanceof Error ? unknownError.message : "Could not load school"),
      );
  }, [institutionId, session?.token]);

  if (error) {
    return <div className="loading-state">{error}</div>;
  }

  if (!institution) {
    return <div className="loading-state">Loading school detail</div>;
  }

  async function saveInstitution(values: Record<string, string | number | null | undefined>) {
    if (!institution) {
      return;
    }

    const payload = await apiPatch<{ institution: InstitutionDetail }>(
      `/api/institutions/${institution.id}`,
      values,
      session?.token,
    );
    setInstitution((current) => (current ? { ...current, ...payload.institution } : payload.institution));
    setEditing(false);
    await refresh();
  }

  async function archiveInstitution() {
    if (!institution || !window.confirm(`Archive ${institution.name}?`)) {
      return;
    }

    await apiDelete(`/api/institutions/${institution.id}`, session?.token);
    await refresh();
    navigate("/workspace/institutions");
  }

  return (
    <div className="workspace-scroll">
      <section className="record-header">
        <Link className="record-back" to="/workspace/institutions">
          <ArrowLeft size={13} />
          Schools
        </Link>
        <div className="record-title-row">
          <div className="record-avatar">{institution.name.charAt(0)}</div>
          <div>
            <h1>{institution.name}</h1>
            <p>
              {institution.code} · {institution.hubName} · {institution.region}
            </p>
          </div>
          <div className="record-title-actions">
            <InstitutionStatusBadge status={institution.status} />
            <ActionMenu
              canDelete={canManage}
              canEdit={canManage}
              deleteLabel="Archive school"
              onDelete={() => void archiveInstitution()}
              onEdit={() => setEditing(true)}
            />
          </div>
        </div>
        <div className="metric-strip">
          <div>
            <span>Students</span>
            <strong>{institution.studentCount.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span>Employees</span>
            <strong>{institution.employeeAssignmentCount}</strong>
          </div>
          <div>
            <span>Projects</span>
            <strong>{institution.projectCount}</strong>
          </div>
          <div>
            <span>District</span>
            <strong>{institution.district}</strong>
          </div>
        </div>
      </section>

      <RecordTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "counts", label: "Counts" },
          { id: "status", label: "Student Status" },
          { id: "geography", label: "Geography" },
        ]}
      />

      <section className="dashboard-grid">
        {activeTab === "profile" && (
          <Panel className="span-12" title="School profile">
            <div className="profile-list">
              <div>
                <MapPin size={16} />
                <span>{institution.address}</span>
              </div>
              <div>
                <Users size={16} />
                <span>{institution.principalName}</span>
              </div>
              <div>
                <Mail size={16} />
                <span>{institution.contactEmail}</span>
              </div>
            </div>
          </Panel>
        )}

        {activeTab === "counts" && (
          <Panel className="span-12" title="Operational counts">
            <div className="metric-stack">
              <div>
                <span>Employees</span>
                <strong>{institution.employeeAssignmentCount}</strong>
              </div>
              <div>
                <span>Students</span>
                <strong>{institution.studentCount.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Projects</span>
                <strong>{institution.projectCount}</strong>
              </div>
            </div>
          </Panel>
        )}

        {activeTab === "status" && (
          <Panel className="span-12" title="Student status">
            <div className="status-grid">
              {institution.studentsByStatus.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {activeTab === "geography" && (
          <Panel className="span-12" title="Geography and performance">
            <div className="detail-band">
              <div>
                <span>Coordinates</span>
                <strong>{institution.latitude.toFixed(4)}, {institution.longitude.toFixed(4)}</strong>
              </div>
              <div>
                <span>Performance score</span>
                <strong>{institution.performanceScore}/100</strong>
              </div>
              <div>
                <span>Map note</span>
                <strong>{institution.geographyNote}</strong>
              </div>
            </div>
          </Panel>
        )}
      </section>
      {editing && (
        <EditSheet
          description="Update school placement, leadership, coordinates and programme metrics."
          fields={editFields}
          initialValues={institutionEditValues(institution)}
          onClose={() => setEditing(false)}
          onSubmit={saveInstitution}
          title={`Edit ${institution.name}`}
        />
      )}
    </div>
  );
}
