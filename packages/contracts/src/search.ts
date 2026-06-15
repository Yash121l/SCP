export type SearchResult = {
  id: string;
  label: string;
  meta: string;
  type: "hub" | "institution" | "employee" | "student" | "approval" | "project" | "curriculum";
  path: string;
};
