import type { HubEmployee } from "./people.js";
import type { Institution } from "./institutions.js";
import type { StudentRecord } from "./students.js";

export type HubStatus = "active" | "onboarding" | "attention" | "archived";

export type IncubationHub = {
  id: string;
  code: string;
  name: string;
  region: string;
  district: string;
  latitude: number;
  longitude: number;
  geographyNote: string;
  performanceScore: number;
  status: HubStatus;
  institutionCount: number;
  employeeCount: number;
  studentCount: number;
};

export type HubDetail = IncubationHub & {
  employees: HubEmployee[];
  institutions: Institution[];
  students: StudentRecord[];
};
