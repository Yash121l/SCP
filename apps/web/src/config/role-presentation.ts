import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const roleIcon: Record<string, LucideIcon> = {
  "pmu-admin": Gauge,
  leadership: ShieldCheck,
  secretariat: ClipboardCheck,
  "incubator-admin": Building2,
  "school-admin": GraduationCap,
  teacher: BookOpen,
  student: GraduationCap,
  mentor: Users,
  "funding-partner": BriefcaseBusiness,
};

export const roleAccent: Record<string, string> = {
  teal: "border-teal-400/30 bg-teal-500/10 text-teal-700 dark:text-teal-200",
  blue: "border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-700 dark:text-violet-200",
  green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  orange: "border-orange-400/30 bg-orange-500/10 text-orange-700 dark:text-orange-200",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  slate: "border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-200",
};
