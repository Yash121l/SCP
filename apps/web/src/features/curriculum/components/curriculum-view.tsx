import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";
import { Badge } from "@scp/ui";
import { ViewHeader } from "../../../components/common/view-header.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";

function toneForStatus(status: string) {
  if (status === "completed") return "green" as const;
  if (status === "at_risk") return "amber" as const;
  if (status === "active") return "blue" as const;
  return "neutral" as const;
}

export function CurriculumView() {
  const { curriculum, hubs } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [hubId, setHubId] = useState("");
  const [band, setBand] = useState("");
  const [status, setStatus] = useState("");

  const bands = useMemo(
    () => Array.from(new Set(curriculum.map((item) => item.gradeBand))).sort(),
    [curriculum],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return curriculum.filter((item) => {
      const matchesQuery =
        !needle ||
        [item.moduleCode, item.moduleTitle, item.domain, item.hubName, item.nextTopic].some((value) =>
          value.toLowerCase().includes(needle),
        );
      return (
        matchesQuery &&
        (!hubId || item.hubId === hubId) &&
        (!band || item.gradeBand === band) &&
        (!status || item.status === status)
      );
    });
  }, [band, curriculum, hubId, query, status]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Curriculum"
        description="Incubator-owned curriculum delivery, stages, mapped students and linked projects."
      />

      <div className="index-toolbar">
        <input
          aria-label="Search curriculum"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search modules, incubators, topics..."
          value={query}
        />
        <select aria-label="Filter curriculum by incubator" onChange={(event) => setHubId(event.target.value)} value={hubId}>
          <option value="">All Incubators</option>
          {hubs.map((hub) => (
            <option key={hub.id} value={hub.id}>
              {hub.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter curriculum by grade band" onChange={(event) => setBand(event.target.value)} value={band}>
          <option value="">All Grade Bands</option>
          {bands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select aria-label="Filter curriculum by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All Status</option>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="at_risk">At risk</option>
          <option value="completed">Completed</option>
        </select>
        <span>{filtered.length} of {curriculum.length}</span>
      </div>

      <div className="index-table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Incubator</th>
                <th>Grade band</th>
                <th>Stages</th>
                <th>Students</th>
                <th>Progress</th>
                <th>Next topic</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td data-label="Module">
                    <Link className="table-identity" to={`/workspace/curriculum/${item.id}`}>
                      <span>
                        <BookOpenCheck size={14} />
                      </span>
                      <strong>{item.moduleTitle}</strong>
                      <small>{item.moduleCode} · {item.domain}</small>
                    </Link>
                  </td>
                  <td data-label="Incubator">{item.hubName}</td>
                  <td data-label="Grade band">{item.gradeBand}</td>
                  <td data-label="Stages">{item.stageCount}</td>
                  <td data-label="Students">{item.studentCount}</td>
                  <td data-label="Progress">
                    <div className="table-progress">
                      <span>{item.completedSessions}/{item.plannedSessions} sessions</span>
                      <div className="progress-track">
                        <span style={{ width: `${item.completionPercent}%` }} />
                      </div>
                    </div>
                  </td>
                  <td data-label="Next topic">{item.nextTopic}</td>
                  <td data-label="Status">
                    <Badge tone={toneForStatus(item.status)}>{item.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="empty-table-cell" colSpan={8} data-label="Empty">
                    <Badge>No curriculum rows match your filters</Badge>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
