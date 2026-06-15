import type { Permission } from "./rbac.js";

export type ProfileSummary = {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  scope: {
    organizationName: string;
    organizationType: string;
    hubId: string | null;
    institutionId: string | null;
    studentId: string | null;
  };
  permissions: Permission[];
};
