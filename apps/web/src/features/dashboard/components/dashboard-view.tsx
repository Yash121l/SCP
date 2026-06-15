import { Badge, Panel } from "@scp/ui";
import { userHasPermission, type DashboardSummary, type ProgrammeRole, type SessionUser } from "@scp/contracts";
import { Link } from "react-router-dom";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";
import { ApprovalsTable } from "../../governance/components/approvals-table.js";
import { IndicatorList } from "../../reports/components/indicator-list.js";

function statusCounts(items: Array<{ status: string }>) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
    return accumulator;
  }, {});
}

function ProjectStatusChart({ projects }: { projects: Array<{ status: string }> }) {
  const counts = statusCounts(projects);
  const rows = Object.entries(counts);
  const max = Math.max(1, ...rows.map(([, value]) => value));

  return (
    <div className="chart-list">
      {rows.map(([status, value]) => (
        <div className="chart-row" key={status}>
          <span>{status.replace("_", " ")}</span>
          <div>
            <i style={{ width: `${Math.max(12, (value / max) * 100)}%` }} />
          </div>
          <strong>{value}</strong>
        </div>
      ))}
      {rows.length === 0 && <p className="empty-table-cell">No projects in this scope.</p>}
    </div>
  );
}

function toneForStatus(status: string) {
  if (status === "active" || status === "completed" || status === "approved") {
    return "green";
  }
  if (status === "attention" || status === "on_hold" || status === "rejected" || status === "returned") {
    return "amber";
  }
  return "blue";
}

function DashboardKpis({
  curriculum,
  hubs,
  institutions,
  projects,
  students,
}: {
  curriculum: Array<{ completionPercent: number }>;
  hubs: Array<{ status: string }>;
  institutions: Array<{ performanceScore: number; status: string }>;
  projects: Array<{ status: string }>;
  students: Array<{ status: string }>;
}) {
  const healthySchools = institutions.filter((institution) => institution.performanceScore >= 80).length;
  const watchSchools = institutions.filter((institution) => institution.performanceScore < 80 && institution.performanceScore >= 65).length;
  const atRiskSchools = institutions.filter((institution) => institution.performanceScore < 65).length;
  const avgCurriculum = curriculum.length
    ? Math.round(curriculum.reduce((sum, item) => sum + item.completionPercent, 0) / curriculum.length)
    : 0;
  const activeProjects = projects.filter((project) => ["approved", "in_progress"].includes(project.status)).length;

  const rows = [
    { change: "schools", label: "Healthy", tone: "good", value: healthySchools },
    { change: "schools", label: "Watchlist", tone: "warn", value: watchSchools },
    { change: "needs field support", label: "At risk", tone: "bad", value: atRiskSchools },
    { change: `${hubs.filter((hub) => hub.status === "active").length} active incubators`, label: "Total schools", tone: "neutral", value: institutions.length },
    { change: `${students.filter((student) => student.status === "active").length} active`, label: "Students", tone: "neutral", value: students.length },
    { change: `${activeProjects} active · ${avgCurriculum}% curriculum`, label: "Projects", tone: "neutral", value: projects.length },
  ];

  return (
    <section aria-label="Dashboard health metrics" className="dashboard-kpi-strip">
      {rows.map((row) => (
        <article className={`fundos-kpi tone-${row.tone}`} key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value.toLocaleString("en-IN")}</strong>
          <small>{row.change}</small>
        </article>
      ))}
    </section>
  );
}

function NeedsAttentionList({
  curriculum,
  institutions,
  projects,
}: {
  curriculum: Array<{ completionPercent: number; hubName: string; id: string; moduleCode: string; nextTopic: string }>;
  institutions: Array<{ geographyNote: string; id: string; name: string; performanceScore: number; status: string }>;
  projects: Array<{ id: string; institutionName: string; status: string; title: string; updatedAt: string }>;
}) {
  const rows = [
    ...institutions
      .filter((institution) => institution.status === "attention" || institution.performanceScore < 75)
      .map((institution) => ({
        badge: institution.performanceScore < 65 ? "At risk" : "Watchlist",
        detail: institution.geographyNote,
        href: `/workspace/institutions/${institution.id}`,
        key: `institution-${institution.id}`,
        meta: `${institution.performanceScore} health score`,
        title: institution.name,
        tone: institution.performanceScore < 65 ? "red" : "amber",
      })),
    ...projects
      .filter((project) => ["under_review", "on_hold", "proposed"].includes(project.status))
      .map((project) => ({
        badge: project.status.replace("_", " "),
        detail: project.institutionName,
        href: `/workspace/projects/${project.id}`,
        key: `project-${project.id}`,
        meta: new Date(project.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        title: project.title,
        tone: "blue",
      })),
    ...curriculum
      .filter((item) => item.completionPercent < 70)
      .map((item) => ({
        badge: `${item.completionPercent}%`,
        detail: item.nextTopic,
        href: `/workspace/curriculum/${item.id}`,
        key: `curriculum-${item.id}`,
        meta: item.moduleCode,
        title: item.hubName,
        tone: item.completionPercent < 45 ? "amber" : "blue",
      })),
  ].slice(0, 9);

  return (
    <section className="attention-panel">
      <header>
        <div>
          <h2>Needs Attention</h2>
          <Badge tone="amber">{rows.length}</Badge>
        </div>
        <Link to="/workspace/updates">View all</Link>
      </header>
      <div className="attention-list">
        {rows.map((row) => (
          <Link className="attention-row" key={row.key} to={row.href}>
            <span className={`attention-avatar ${row.tone}`}>{row.title.charAt(0)}</span>
            <div>
              <strong>{row.title}</strong>
              <small>{row.meta}</small>
            </div>
            <p>{row.detail}</p>
            <Badge tone={row.tone === "red" ? "red" : row.tone === "amber" ? "amber" : "blue"}>{row.badge}</Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HealthRing({
  institutions,
}: {
  institutions: Array<{ performanceScore: number }>;
}) {
  const healthy = institutions.filter((institution) => institution.performanceScore >= 80).length;
  const watchlist = institutions.filter((institution) => institution.performanceScore < 80 && institution.performanceScore >= 65).length;
  const atRisk = institutions.filter((institution) => institution.performanceScore < 65).length;
  const total = Math.max(1, institutions.length);
  const circumference = 2 * Math.PI * 46;
  const healthyLength = (healthy / total) * circumference;
  const watchLength = (watchlist / total) * circumference;
  const riskLength = (atRisk / total) * circumference;

  return (
    <div className="health-ring-card">
      <svg aria-label="Programme health ring" className="health-ring" viewBox="0 0 120 120">
        <circle className="ring-track" cx="60" cy="60" r="46" />
        <circle className="ring-green" cx="60" cy="60" r="46" strokeDasharray={`${healthyLength} ${circumference - healthyLength}`} />
        <circle
          className="ring-amber"
          cx="60"
          cy="60"
          r="46"
          strokeDasharray={`${watchLength} ${circumference - watchLength}`}
          strokeDashoffset={-healthyLength}
        />
        <circle
          className="ring-red"
          cx="60"
          cy="60"
          r="46"
          strokeDasharray={`${riskLength} ${circumference - riskLength}`}
          strokeDashoffset={-(healthyLength + watchLength)}
        />
      </svg>
      <div className="health-ring-center">
        <strong>{institutions.length}</strong>
        <span>schools</span>
      </div>
      <div className="health-legend">
        <span><b className="green" />{healthy} Healthy</span>
        <span><b className="amber" />{watchlist} Watchlist</span>
        <span><b className="red" />{atRisk} At risk</span>
      </div>
    </div>
  );
}

function ActiveTrends({
  curriculum,
  feedbackCount,
  projects,
}: {
  curriculum: Array<{ completionPercent: number; moduleCode: string }>;
  feedbackCount: number;
  projects: Array<{ domain: string; status: string }>;
}) {
  const reviewProjects = projects.filter((project) => project.status === "under_review").length;
  const lowCurriculum = curriculum.filter((item) => item.completionPercent < 60).slice(0, 2);
  const rows = [
    {
      badge: reviewProjects > 0 ? "HIGH" : "LOW",
      tags: projects.slice(0, 3).map((project) => project.domain),
      title: `${reviewProjects} project approvals waiting for steering review`,
    },
    {
      badge: lowCurriculum.length > 0 ? "MEDIUM" : "LOW",
      tags: lowCurriculum.map((item) => item.moduleCode),
      title: "Curriculum stages below expected progress",
    },
    {
      badge: feedbackCount > 4 ? "HIGH" : "MEDIUM",
      tags: ["Experts", "Feedback"],
      title: `${feedbackCount} expert feedback notes logged across projects`,
    },
  ];

  return (
    <div className="trend-list">
      {rows.map((row) => (
        <div className="trend-row" key={row.title}>
          <strong>{row.title}</strong>
          <Badge tone={row.badge === "HIGH" ? "amber" : row.badge === "MEDIUM" ? "blue" : "green"}>{row.badge}</Badge>
          <div className="mini-tags">
            {row.tags.filter(Boolean).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GeographicPanel({
  institutions,
}: {
  institutions: Array<{
    district: string;
    geographyNote: string;
    latitude: number;
    longitude: number;
    name: string;
    performanceScore: number;
    projectCount: number;
    region: string;
    studentCount: number;
  }>;
}) {
  if (institutions.length === 0) {
    return <p className="empty-table-cell">No geographic records in this scope.</p>;
  }

  const latitudes = institutions.map((item) => item.latitude);
  const longitudes = institutions.map((item) => item.longitude);
  const centerLat = latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length;
  const centerLng = longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length;
  const latRange = Math.max(...latitudes) - Math.min(...latitudes);
  const lngRange = Math.max(...longitudes) - Math.min(...longitudes);
  const zoom = Math.max(5, Math.min(9, latRange < 1.4 && lngRange < 1.4 ? 9 : latRange < 4 && lngRange < 4 ? 7 : 6));
  const tileSize = 256;
  const mapWidth = 640;
  const mapHeight = 330;

  function project(latitude: number, longitude: number) {
    const sin = Math.sin((latitude * Math.PI) / 180);
    const scale = tileSize * 2 ** zoom;
    return {
      x: ((longitude + 180) / 360) * scale,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    };
  }

  const center = project(centerLat, centerLng);
  const startX = center.x - mapWidth / 2;
  const startY = center.y - mapHeight / 2;
  const firstTileX = Math.floor(startX / tileSize);
  const firstTileY = Math.floor(startY / tileSize);
  const tileColumns = Math.ceil(mapWidth / tileSize) + 2;
  const tileRows = Math.ceil(mapHeight / tileSize) + 2;
  const worldTiles = 2 ** zoom;
  const tiles = Array.from({ length: tileColumns * tileRows }, (_, index) => {
    const column = index % tileColumns;
    const row = Math.floor(index / tileColumns);
    const rawX = firstTileX + column;
    const y = firstTileY + row;
    const x = ((rawX % worldTiles) + worldTiles) % worldTiles;
    return {
      key: `${x}-${y}`,
      left: rawX * tileSize - startX,
      top: y * tileSize - startY,
      url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
    };
  });

  return (
    <div className="geo-map-layout">
      <div className="geo-tile-map" role="img" aria-label="School geography map">
        {tiles.map((tile) => (
          <img alt="" height={tileSize} key={tile.key} loading="lazy" src={tile.url} style={{ left: tile.left, top: tile.top }} width={tileSize} />
        ))}
        {institutions.map((institution) => (
          <button
            className={`map-marker ${institution.performanceScore >= 80 ? "good" : institution.performanceScore >= 70 ? "warn" : "bad"}`}
            key={institution.name}
            style={{
              height: 16 + Math.min(14, institution.projectCount / 3),
              left: project(institution.latitude, institution.longitude).x - startX,
              top: project(institution.latitude, institution.longitude).y - startY,
              width: 16 + Math.min(14, institution.projectCount / 3),
            }}
            title={`${institution.name}, ${institution.district}: ${institution.performanceScore}`}
            type="button"
          >
            <span>{institution.performanceScore}</span>
          </button>
        ))}
        <small>OpenStreetMap · {institutions.length} mapped schools</small>
      </div>
      <div className="geo-list">
        {institutions
          .slice()
          .sort((left, right) => right.performanceScore - left.performanceScore)
          .map((institution) => (
            <div className="geo-row" key={institution.name}>
              <div>
                <strong>{institution.name}</strong>
                <span>{institution.district} · {institution.region}</span>
                <small>{institution.geographyNote}</small>
              </div>
              <b>{institution.performanceScore}</b>
            </div>
          ))}
      </div>
    </div>
  );
}

function CurriculumChart({
  rows,
}: {
  rows: Array<{ completionPercent: number; hubName: string; moduleCode: string }>;
}) {
  return (
    <div className="compact-list">
      {rows.slice(0, 5).map((item) => (
        <div className="curriculum-row" key={`${item.hubName}-${item.moduleCode}`}>
          <div>
            <strong>{item.hubName}</strong>
            <span>{item.moduleCode}</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${item.completionPercent}%` }} />
          </div>
          <b>{item.completionPercent}%</b>
        </div>
      ))}
      {rows.length === 0 && <p className="empty-table-cell">No curriculum progress in this scope.</p>}
    </div>
  );
}

function roleTitle(role: ProgrammeRole) {
  const labels: Record<ProgrammeRole, string> = {
    external_expert: "Expert review workspace",
    government_main: "Government oversight workspace",
    incubator: "Incubator operations workspace",
    incubator_employee: "Programme delivery workspace",
    school: "School champion workspace",
    steering_committee: "Steering setup workspace",
    student: "Student project workspace",
  };

  return labels[role];
}

type RoleOpsRow = {
  href: string;
  meta: string;
  metric?: string;
  status?: string;
  title: string;
};

function RoleOpsTable({ rows, title }: { rows: RoleOpsRow[]; title: string }) {
  return (
    <section className="role-ops-table-panel">
      <header>
        <h2>{title}</h2>
        <Badge tone="blue">{rows.length}</Badge>
      </header>
      <div className="role-ops-table-wrap">
        <table className="role-ops-table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Context</th>
              <th>Metric</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row) => (
              <tr key={`${row.href}-${row.title}`}>
                <td>
                  <Link className="role-table-identity" to={row.href}>
                    <span>{row.title.charAt(0)}</span>
                    <strong>{row.title}</strong>
                  </Link>
                </td>
                <td>{row.meta}</td>
                <td>{row.metric ?? "—"}</td>
                <td>{row.status ? <Badge tone={toneForStatus(row.status)}>{row.status.replace("_", " ")}</Badge> : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="empty-table-cell" colSpan={4}>No records in this scope.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleOpsDashboard({
  actions,
  description,
  eyebrow,
  metrics,
  primaryRows,
  primaryTitle,
  railRows,
  railTitle,
  secondaryRows,
  secondaryTitle,
  title,
}: {
  actions: Array<{ href: string; label: string }>;
  description: string;
  eyebrow: string;
  metrics: Array<{ label: string; note: string; value: string }>;
  primaryRows: RoleOpsRow[];
  primaryTitle: string;
  railRows: RoleOpsRow[];
  railTitle: string;
  secondaryRows?: RoleOpsRow[];
  secondaryTitle?: string;
  title: string;
}) {
  return (
    <div className="workspace-scroll role-ops">
      <section className="role-ops-topline">
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="role-ops-actions">
          {actions.map((action) => (
            <Link key={action.href} to={action.href}>{action.label}</Link>
          ))}
        </div>
      </section>

      <section className="role-ops-metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </section>

      <section className="role-ops-layout">
        <main>
          <RoleOpsTable rows={primaryRows} title={primaryTitle} />
          {secondaryRows && secondaryTitle && <RoleOpsTable rows={secondaryRows} title={secondaryTitle} />}
        </main>
        <aside className="role-ops-rail">
          <section>
            <header>
              <h2>{railTitle}</h2>
              <Link to="/workspace/updates">View all</Link>
            </header>
            <div>
              {railRows.slice(0, 6).map((row) => (
                <Link className="role-rail-row" key={`${row.href}-${row.title}`} to={row.href}>
                  <strong>{row.title}</strong>
                  <span>{row.meta}</span>
                  {row.status && <Badge tone={toneForStatus(row.status)}>{row.status.replace("_", " ")}</Badge>}
                </Link>
              ))}
              {railRows.length === 0 && <p className="empty-table-cell">No current items.</p>}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function RoleDashboard({ summary, user }: { summary: DashboardSummary; user: SessionUser }) {
  const role = user.roles[0] ?? "government_main";
  const canManageHubs = userHasPermission(user, "hubs:manage");
  const canManagePeople = userHasPermission(user, "people:manage");
  const canManageSchools = userHasPermission(user, "institutions:manage");
  const canManageStudents = userHasPermission(user, "students:manage");
  const canManageProjects = userHasPermission(user, "projects:manage");

  if (role === "government_main") {
    return null;
  }

  const activeHubs = summary.hubs.filter((hub) => hub.status !== "archived");
  const activeInstitutions = summary.institutions.filter((institution) => institution.status !== "archived");
  const pendingApprovals = summary.approvals.filter((approval) => approval.status === "pending" || approval.status === "returned");

  const roleCopy: Record<ProgrammeRole, string> = {
    external_expert: "Review student projects, add expert feedback and track partner review history.",
    government_main: "Observe programme performance across every incubator, school and geography.",
    incubator: "Add schools, monitor curriculum delivery and move school-level programme work forward.",
    incubator_employee: "Run curriculum stages, track projects and support assigned school activity.",
    school: "Add students, maintain student records and raise projects from the school.",
    steering_committee: "Create incubators, assign incubator employees and review setup approvals.",
    student: "Track your curriculum progress and project record in one focused workspace.",
  };

  if (role === "steering_committee") {
    return (
      <RoleOpsDashboard
        actions={[
          ...(canManageHubs ? [{ href: "/workspace/hubs/new", label: "Add incubator" }] : []),
          ...(canManagePeople ? [{ href: "/workspace/people/new", label: "Add employee" }] : []),
        ]}
        description={roleCopy[role]}
        eyebrow={roleTitle(role)}
        metrics={[
          { label: "Incubators", note: "active network anchors", value: String(activeHubs.length) },
          { label: "Employees", note: "mapped to incubators", value: String(summary.employees.length) },
          { label: "Approvals", note: "pending or returned", value: String(pendingApprovals.length) },
          { label: "Schools", note: "under active incubators", value: String(activeInstitutions.length) },
        ]}
        primaryRows={activeHubs.map((hub) => ({ href: `/workspace/hubs/${hub.id}`, meta: `${hub.region} · ${hub.district}`, metric: `${hub.institutionCount} schools`, status: hub.status, title: hub.name }))}
        primaryTitle="Incubator setup"
        railRows={pendingApprovals.map((approval) => ({ href: "/workspace/governance", meta: `${approval.module} · ${approval.owner}`, status: approval.status, title: approval.title }))}
        railTitle="Review queue"
        secondaryRows={summary.employees.map((employee) => ({ href: "/workspace/people", meta: `${employee.hubName} · ${employee.designation}`, metric: employee.institutionName ?? "Incubator level", status: employee.status, title: employee.name }))}
        secondaryTitle="Employee assignment"
        title="Set up the programme network"
      />
    );
  }

  if (role === "incubator" || role === "incubator_employee") {
    return (
      <RoleOpsDashboard
        actions={[
          ...(canManageSchools ? [{ href: "/workspace/institutions/new", label: "Add school" }] : []),
          ...(canManageProjects ? [{ href: "/workspace/projects/new", label: "Raise project" }] : []),
        ]}
        description={roleCopy[role]}
        eyebrow={roleTitle(role)}
        metrics={[
          { label: "Schools", note: "active in this cluster", value: String(activeInstitutions.length) },
          { label: "Students", note: "scoped records", value: String(summary.students.length) },
          { label: "Projects", note: "school pipeline", value: String(summary.projects.length) },
          { label: "Curriculum", note: "incubator-owned", value: String(summary.curriculum.length) },
        ]}
        primaryRows={activeInstitutions.map((institution) => ({ href: `/workspace/institutions/${institution.id}`, meta: `${institution.district} · ${institution.region}`, metric: `${institution.studentCount} students`, status: institution.status, title: institution.name }))}
        primaryTitle="School operations"
        railRows={summary.curriculum.map((item) => ({ href: `/workspace/curriculum/${item.id}`, meta: `${item.moduleCode} · ${item.completionPercent}% complete`, status: item.status, title: item.moduleTitle }))}
        railTitle="Curriculum delivery"
        secondaryRows={summary.projects.map((project) => ({ href: `/workspace/projects/${project.id}`, meta: `${project.institutionName} · ${project.domain}`, metric: project.ownerName, status: project.status, title: project.title }))}
        secondaryTitle="Project pipeline"
        title={role === "incubator" ? "Build and monitor your school cluster" : "Run programme delivery"}
      />
    );
  }

  if (role === "school") {
    return (
      <RoleOpsDashboard
        actions={[
          ...(canManageStudents ? [{ href: "/workspace/students/new", label: "Add student" }] : []),
          ...(canManageProjects ? [{ href: "/workspace/projects/new", label: "Raise project" }] : []),
        ]}
        description={roleCopy[role]}
        eyebrow={roleTitle(role)}
        metrics={[
          { label: "Students", note: "school records", value: String(summary.students.length) },
          { label: "Projects", note: "raised by school", value: String(summary.projects.length) },
          { label: "Curriculum", note: "visible stages", value: String(summary.curriculum.length) },
          { label: "Active", note: "students in programme", value: String(summary.students.filter((student) => student.status === "active").length) },
        ]}
        primaryRows={summary.students.map((student) => ({ href: `/workspace/students/${student.id}`, meta: `${student.grade} · ${student.institutionName}`, metric: `${student.projectCount} projects`, status: student.status, title: student.name }))}
        primaryTitle="Student records"
        railRows={summary.curriculum.map((item) => ({ href: `/workspace/curriculum/${item.id}`, meta: `${item.moduleCode} · ${item.completionPercent}% complete`, status: item.status, title: item.moduleTitle }))}
        railTitle="Learning progress"
        secondaryRows={summary.projects.map((project) => ({ href: `/workspace/projects/${project.id}`, meta: `${project.domain} · ${project.ownerName}`, metric: project.studentName ?? "School-led", status: project.status, title: project.title }))}
        secondaryTitle="Project activity"
        title="Maintain student records and school projects"
      />
    );
  }

  if (role === "external_expert") {
    return (
      <RoleOpsDashboard
        actions={[{ href: "/workspace/projects", label: "Open review queue" }]}
        description={roleCopy[role]}
        eyebrow={roleTitle(role)}
        metrics={[
          { label: "Projects", note: "available for review", value: String(summary.projects.length) },
          { label: "Feedback", note: "partner notes", value: String(summary.feedback.length) },
          { label: "Curriculum", note: "learning context", value: String(summary.curriculum.length) },
          { label: "Schools", note: "project sources", value: String(activeInstitutions.length) },
        ]}
        primaryRows={summary.projects.map((project) => ({ href: `/workspace/projects/${project.id}`, meta: `${project.institutionName} · ${project.domain}`, metric: project.ownerName, status: project.status, title: project.title }))}
        primaryTitle="Projects awaiting review"
        railRows={summary.feedback.map((item) => ({ href: `/workspace/projects/${item.projectId}`, meta: `${item.expertOrganization} · ${item.rating}/5`, title: item.projectTitle }))}
        railTitle="Feedback history"
        title="Review projects and add partner feedback"
      />
    );
  }

  return (
    <RoleOpsDashboard
      actions={[{ href: "/workspace/projects/new", label: "Raise project" }]}
      description={roleCopy[role]}
      eyebrow={roleTitle(role)}
      metrics={[
        { label: "Projects", note: "my work", value: String(summary.projects.length) },
        { label: "Curriculum", note: "mapped stages", value: String(summary.curriculum.length) },
        { label: "Feedback", note: "expert notes", value: String(summary.feedback.length) },
        { label: "Schools", note: "current scope", value: String(activeInstitutions.length) },
      ]}
      primaryRows={summary.projects.map((project) => ({ href: `/workspace/projects/${project.id}`, meta: `${project.domain} · ${project.ownerName}`, metric: project.institutionName, status: project.status, title: project.title }))}
      primaryTitle="My projects"
      railRows={summary.curriculum.map((item) => ({ href: `/workspace/curriculum/${item.id}`, meta: `${item.moduleCode} · ${item.completionPercent}% complete`, status: item.status, title: item.moduleTitle }))}
      railTitle="My curriculum"
      title="Track your project and curriculum work"
    />
  );
}

export function DashboardView() {
  const { session } = useAuth();
  const summary = useWorkspaceSummary();

  if (!session) {
    return <EmptyPermission permission="dashboard:read" />;
  }

  const canReadGovernance = userHasPermission(session.user, "governance:read");
  const canReadAudit = userHasPermission(session.user, "audit:read");
  const primaryRole = session.user.roles[0] ?? "government_main";

  if (primaryRole !== "government_main") {
    return <RoleDashboard summary={summary} user={session.user} />;
  }

  return (
    <div className="workspace-scroll dashboard-fundos">
      <DashboardKpis
        curriculum={summary.curriculum}
        hubs={summary.hubs}
        institutions={summary.institutions}
        projects={summary.projects}
        students={summary.students}
      />

      <section className="dashboard-body">
        <main className="dashboard-main-column">
          <NeedsAttentionList
            curriculum={summary.curriculum}
            institutions={summary.institutions}
            projects={summary.projects}
          />

          <section className="recent-updates-panel">
            <header>
              <h2>Recent Updates</h2>
              <Link to="/workspace/updates">View all</Link>
            </header>
            <div className="recent-update-list">
              {summary.notifications.slice(0, 4).map((item) => (
                <div className="recent-update-row" key={item.id}>
                  <span>{item.title.charAt(0)}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.body}</small>
                  </div>
                  <time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="dashboard-rail">
          <section className="rail-card">
            <header>
              <h2>Programme Health</h2>
            </header>
            <HealthRing institutions={summary.institutions} />
          </section>

          <section className="rail-card">
            <header>
              <h2>Active Trends</h2>
              <Link to="/workspace/updates">View all</Link>
            </header>
            <ActiveTrends curriculum={summary.curriculum} feedbackCount={summary.feedback.length} projects={summary.projects} />
          </section>



          <section className="rail-card">
            <header>
              <h2>Recent Alerts</h2>
              <Badge tone="amber">{summary.approvals.length}</Badge>
            </header>
            <div className="alert-list">
              {summary.approvals.slice(0, 3).map((approval) => (
                <div className="alert-row" key={approval.id}>
                  <strong>{approval.title}</strong>
                  <small>{approval.module} · due {new Date(approval.dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small>
                </div>
              ))}
              {canReadAudit && summary.audit.slice(0, 1).map((entry) => (
                <div className="alert-row" key={entry.id}>
                  <strong>{entry.action}</strong>
                  <small>{entry.actor} · audit</small>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="dashboard-lower-grid">
        <Panel title="Project status mix" className="span-5" action={<Badge tone="blue">Status graph</Badge>}>
          <ProjectStatusChart projects={summary.projects} />
        </Panel>
        <Panel title="Curriculum progress" className="span-5" action={<Badge tone="blue">C4 delivery</Badge>}>
          <CurriculumChart rows={summary.curriculum} />
        </Panel>
        <Panel title="Geography" className="span-7" action={<Badge tone="green">Map view</Badge>}>
          <GeographicPanel institutions={summary.institutions} />
        </Panel>
        <Panel title="Operational indicators" className="span-7">
          <IndicatorList indicators={summary.indicators} />
        </Panel>
        {canReadGovernance && (
          <Panel title="Approvals queue" className="span-7">
            <ApprovalsTable approvals={summary.approvals.slice(0, 4)} />
          </Panel>
        )}
      </section>
    </div>
  );
}
