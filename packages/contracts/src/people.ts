export type EmployeeStatus = "active" | "invited" | "suspended";

export type HubEmployee = {
  id: string;
  hubId: string;
  hubName: string;
  institutionId: string | null;
  institutionName: string | null;
  name: string;
  email: string;
  designation: string;
  phone: string;
  status: EmployeeStatus;
};
