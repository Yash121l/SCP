export type ApprovalItem = {
  id: string;
  title: string;
  module: string;
  owner: string;
  status: "pending" | "returned" | "approved" | "rejected";
  dueAt: string;
};

