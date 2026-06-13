import type { LucideIcon } from "lucide-react";

export type Theme = "light" | "dark";

export type ModuleKind =
  | "overview"
  | "profile"
  | "onboarding"
  | "institutions"
  | "students"
  | "projects"
  | "learning"
  | "mentoring"
  | "governance"
  | "resources"
  | "reports"
  | "funding"
  | "impact"
  | "audit";

export type WorkspaceTab = {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  kind: ModuleKind;
  icon: LucideIcon;
};

export type OnboardingStep = {
  label: string;
  status: "done" | "active" | "pending";
  detail: string;
};

export type WorkspaceHighlight = {
  label: string;
  value: string;
  detail: string;
};

export type RoleWorkspace = {
  headline: string;
  subline: string;
  commandLabel: string;
  persona: string;
  profileCompleteness: number;
  onboarding: OnboardingStep[];
  nav: WorkspaceTab[];
  highlights: WorkspaceHighlight[];
};
