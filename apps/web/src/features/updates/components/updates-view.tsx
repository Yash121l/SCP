import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, MessageSquareText, X } from "lucide-react";
import { Badge, Button } from "@scp/ui";
import { ViewHeader } from "../../../components/common/view-header.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";

type UpdateCategory =
  | "incubation_centre"
  | "incubation_update"
  | "student_feedback"
  | "student_progress"
  | "student_update"
  | "upgrade_report";

type ProgrammeUpdate = {
  body: string;
  category: UpdateCategory;
  date: string;
  id: string;
  link?: string;
  meta: string;
  owner: string;
  status: "attention" | "done" | "info" | "review";
  title: string;
};

const categoryLabels: Record<UpdateCategory, string> = {
  incubation_centre: "Incubation centre",
  incubation_update: "Incubation update",
  student_feedback: "Student feedback",
  student_progress: "Student progress",
  student_update: "Student update",
  upgrade_report: "Upgrade report",
};

function toneForStatus(status: ProgrammeUpdate["status"]) {
  if (status === "done") {
    return "green";
  }
  if (status === "attention") {
    return "amber";
  }
  if (status === "review") {
    return "blue";
  }
  return "neutral";
}

export function UpdatesView() {
  const { audit, curriculum, feedback, institutions, projects, students } = useWorkspaceSummary();
  const [category, setCategory] = useState<"" | UpdateCategory>("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ProgrammeUpdate | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const updates = useMemo<ProgrammeUpdate[]>(() => {
    const feedbackRows = feedback.map((item) => ({
      body: item.note,
      category: "student_feedback" as const,
      date: item.createdAt,
      id: `feedback-${item.id}`,
      link: `/workspace/projects/${item.projectId}`,
      meta: `${item.expertName} · ${item.expertOrganization} · ${item.rating}/5`,
      owner: item.expertName,
      status: item.rating >= 4 ? "done" as const : "review" as const,
      title: `Feedback on ${item.projectTitle}`,
    }));

    const curriculumRows = curriculum.map((item) => ({
      body: `${item.moduleTitle} is ${item.completionPercent}% complete. Next topic: ${item.nextTopic}.`,
      category: "student_progress" as const,
      date: new Date().toISOString(),
      id: `curriculum-${item.id}`,
      link: `/workspace/curriculum/${item.id}`,
      meta: `${item.hubName} · ${item.gradeBand}`,
      owner: item.ownerEmployeeName ?? item.hubName,
      status: item.completionPercent >= 80 ? "done" as const : item.completionPercent >= 45 ? "review" as const : "attention" as const,
      title: `${item.moduleCode} delivery progress`,
    }));

    const projectRows = projects.slice(0, 12).map((project) => ({
      body: `${project.problemStatement} ${project.reviewNote ?? project.solutionSummary}`,
      category: "student_update" as const,
      date: project.updatedAt,
      id: `project-${project.id}`,
      link: `/workspace/projects/${project.id}`,
      meta: `${project.institutionName} · ${project.domain}`,
      owner: project.studentName ?? project.ownerName,
      status: project.status === "completed" ? "done" as const : project.status === "on_hold" || project.status === "rejected" ? "attention" as const : "review" as const,
      title: project.title,
    }));

    const centreRows = institutions.map((institution) => ({
      body: `${institution.geographyNote} Coordinates: ${institution.latitude.toFixed(4)}, ${institution.longitude.toFixed(4)}.`,
      category: "incubation_centre" as const,
      date: new Date().toISOString(),
      id: `institution-${institution.id}`,
      link: `/workspace/institutions/${institution.id}`,
      meta: `${institution.hubName} · ${institution.district}`,
      owner: institution.principalName,
      status: institution.performanceScore >= 80 ? "done" as const : institution.performanceScore >= 70 ? "review" as const : "attention" as const,
      title: institution.name,
    }));

    const auditRows = audit.slice(0, 16).map((entry) => ({
      body: `${entry.action} by ${entry.actor}. This controlled event is available in audit history.`,
      category: entry.entityType === "hub" ? "incubation_update" as const : "upgrade_report" as const,
      date: entry.createdAt,
      id: `audit-${entry.id}`,
      meta: entry.entityType,
      owner: entry.actor,
      status: "info" as const,
      title: entry.action,
    }));

    const studentRows = students.slice(0, 10).map((student) => ({
      body: `${student.name} is in ${student.grade} at ${student.institutionName}, mapped to ${student.projectCount} projects.`,
      category: "student_progress" as const,
      date: new Date().toISOString(),
      id: `student-${student.id}`,
      link: `/workspace/students/${student.id}`,
      meta: `${student.hubName} · ${student.status}`,
      owner: student.name,
      status: student.status === "active" ? "review" as const : student.status === "graduated" ? "done" as const : "attention" as const,
      title: `${student.name} progress snapshot`,
    }));

    return [...feedbackRows, ...curriculumRows, ...projectRows, ...centreRows, ...auditRows, ...studentRows].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  }, [audit, curriculum, feedback, institutions, projects, students]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return updates.filter((item) => {
      const matchesCategory = !category || item.category === category;
      const matchesQuery =
        !needle ||
        [item.title, item.body, item.meta, item.owner, categoryLabels[item.category]].some((value) =>
          value.toLowerCase().includes(needle),
        );
      return matchesCategory && matchesQuery;
    });
  }, [category, query, updates]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Programme updates"
        description="Student feedback, progress, upgrade reports, incubation updates and centre health."
      />

      <div className="index-toolbar">
        <input
          aria-label="Search programme updates"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search updates..."
          value={query}
        />
        <select aria-label="Filter updates by category" onChange={(event) => setCategory(event.target.value as "" | UpdateCategory)} value={category}>
          <option value="">All categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span>{filtered.length} of {updates.length}</span>
      </div>

      <div className="updates-feed">
        {filtered.map((item) => (
          <button className="update-row" key={item.id} onClick={() => setSelected(item)} type="button">
            <span className="update-icon">
              <MessageSquareText size={15} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <small>{categoryLabels[item.category]} · {item.meta}</small>
              <p>{item.body}</p>
            </div>
            <Badge tone={reviewed[item.id] ? "green" : toneForStatus(item.status)}>
              {reviewed[item.id] ? "reviewed" : item.status}
            </Badge>
          </button>
        ))}
      </div>

      {selected && (
        <div className="sheet-overlay" role="presentation">
          <button aria-label="Close update detail" className="sheet-scrim" onClick={() => setSelected(null)} type="button" />
          <aside aria-label={selected.title} className="record-sheet update-sheet">
            <header>
              <div>
                <h2>{selected.title}</h2>
                <p>{categoryLabels[selected.category]} · {selected.meta}</p>
              </div>
              <Button aria-label="Close" onClick={() => setSelected(null)} size="icon" type="button" variant="ghost">
                <X size={15} />
              </Button>
            </header>
            <div className="update-detail">
              <Badge tone={reviewed[selected.id] ? "green" : toneForStatus(selected.status)}>
                {reviewed[selected.id] ? "reviewed" : selected.status}
              </Badge>
              <p>{selected.body}</p>
              <dl>
                <div>
                  <dt>Owner</dt>
                  <dd>{selected.owner}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{new Date(selected.date).toLocaleDateString("en-IN")}</dd>
                </div>
              </dl>
              {selected.link && (
                <Link className="ui-button ui-button-secondary ui-button-md" to={selected.link}>
                  Open source record
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            <footer>
              <Button onClick={() => setSelected(null)} type="button" variant="ghost">
                Close
              </Button>
              <Button
                onClick={() => {
                  setReviewed((current) => ({ ...current, [selected.id]: true }));
                  setSelected(null);
                }}
                type="button"
                variant="primary"
              >
                <CheckCircle2 size={15} />
                Mark reviewed
              </Button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
