import type {
  ApprovalItem,
  IncubationHub,
  Institution,
  StudentProject,
  StudentRecord,
} from "@scp/contracts";
import { Badge } from "@scp/ui";

export function ApprovalStatusBadge({ status }: { status: ApprovalItem["status"] }) {
  if (status === "approved") {
    return <Badge tone="green">approved</Badge>;
  }

  if (status === "returned" || status === "rejected") {
    return <Badge tone="amber">{status}</Badge>;
  }

  return <Badge tone="blue">pending</Badge>;
}

export function InstitutionStatusBadge({ status }: { status: Institution["status"] }) {
  if (status === "attention") {
    return <Badge tone="amber">attention</Badge>;
  }

  if (status === "archived") {
    return <Badge tone="neutral">archived</Badge>;
  }

  return <Badge tone="green">{status}</Badge>;
}

export function HubStatusBadge({ status }: { status: IncubationHub["status"] }) {
  if (status === "attention") {
    return <Badge tone="amber">attention</Badge>;
  }

  if (status === "archived") {
    return <Badge tone="neutral">archived</Badge>;
  }

  return <Badge tone="green">{status}</Badge>;
}

export function StudentStatusBadge({ status }: { status: StudentRecord["status"] }) {
  if (status === "paused") {
    return <Badge tone="amber">paused</Badge>;
  }

  if (status === "graduated") {
    return <Badge tone="neutral">graduated</Badge>;
  }

  return <Badge tone="green">active</Badge>;
}

export function ProjectStatusBadge({ status }: { status: StudentProject["status"] }) {
  if (status === "completed" || status === "approved") {
    return <Badge tone="green">{status.replace("_", " ")}</Badge>;
  }

  if (status === "on_hold" || status === "rejected") {
    return <Badge tone="amber">{status.replace("_", " ")}</Badge>;
  }

  if (status === "in_progress") {
    return <Badge tone="blue">in progress</Badge>;
  }

  return <Badge tone="neutral">{status.replace("_", " ")}</Badge>;
}
