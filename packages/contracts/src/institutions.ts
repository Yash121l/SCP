export type Institution = {
  id: string;
  hubId: string;
  hubName: string;
  code: string;
  name: string;
  type: "school" | "college" | "polytechnic" | "iti";
  region: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  geographyNote: string;
  performanceScore: number;
  principalName: string;
  contactEmail: string;
  status: "active" | "onboarding" | "attention" | "archived";
  employeeCount: number;
  studentCount: number;
  projectCount: number;
};

export type InstitutionDetail = Institution & {
  employeeAssignmentCount: number;
  studentsByStatus: Array<{
    label: string;
    value: number;
  }>;
};
