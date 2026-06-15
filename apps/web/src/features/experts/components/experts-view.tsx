import { useMemo, useState } from "react";
import { MessageSquareText, UserRoundCheck } from "lucide-react";
import { Badge } from "@scp/ui";
import { ViewHeader } from "../../../components/common/view-header.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function ExpertsView() {
  const { experts, feedback } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return experts.filter((expert) => {
      const matchesQuery =
        !needle ||
        [expert.name, expert.email, expert.organization, expert.focusArea].some((value) =>
          value.toLowerCase().includes(needle),
        );
      return matchesQuery && (!status || expert.status === status);
    });
  }, [experts, query, status]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Experts"
        description="External reviewers, institutional partners and feedback history."
      />

      <section className="dashboard-grid">
        <div className="span-7">
          <div className="index-toolbar">
            <input
              aria-label="Search experts"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search experts..."
              value={query}
            />
            <select aria-label="Filter experts by status" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
            <span>{filtered.length} of {experts.length}</span>
          </div>

          <div className="index-table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Expert</th>
                    <th>Organization</th>
                    <th>Focus</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expert) => (
                    <tr key={expert.id}>
                      <td data-label="Expert">
                        <span className="table-identity static">
                          <span>
                            <UserRoundCheck size={14} />
                          </span>
                          <strong>{expert.name}</strong>
                          <small>{expert.email}</small>
                        </span>
                      </td>
                      <td data-label="Organization">{expert.organization}</td>
                      <td data-label="Focus">{expert.focusArea}</td>
                      <td data-label="Status"><Badge tone={expert.status === "active" ? "green" : "amber"}>{expert.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="span-5">
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2>Recent feedback</h2>
              <Badge tone="blue">{feedback.length} notes</Badge>
            </div>
            <div className="compact-list">
              {feedback.slice(0, 8).map((item) => (
                <div className="compact-row" key={item.id}>
                  <MessageSquareText size={15} />
                  <div>
                    <strong>{item.projectTitle}</strong>
                    <span>{item.expertName} · {item.rating}/5</span>
                    <span>{item.note}</span>
                  </div>
                </div>
              ))}
              {feedback.length === 0 && <p className="empty-table-cell">No feedback yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
