import {
  incubationHubs,
  institutions,
  organizations,
  students,
  userRoles,
  users,
  type DatabaseClient,
} from "@scp/database";
import { and, eq } from "drizzle-orm";

export type UserAuthRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  roles: Array<{
    hubId: string | null;
    institutionId: string | null;
    organizationId: string | null;
    organizationName: string;
    organizationType: string;
    role: string;
  }>;
  studentId: string | null;
};

export function createAuthRepository(db: DatabaseClient) {
  return {
    async findActiveUserByEmail(email: string): Promise<UserAuthRecord | null> {
      const [user] = await db
        .select({
          email: users.email,
          id: users.id,
          name: users.name,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(and(eq(users.email, email), eq(users.status, "active")))
        .limit(1);

      if (!user) {
        return null;
      }

      const roles = await db
        .select({
          hubId: incubationHubs.id,
          institutionHubId: institutions.hubId,
          institutionId: institutions.id,
          organizationId: userRoles.organizationId,
          organizationName: organizations.name,
          organizationType: organizations.type,
          role: userRoles.role,
        })
        .from(userRoles)
        .leftJoin(organizations, eq(userRoles.organizationId, organizations.id))
        .leftJoin(incubationHubs, eq(incubationHubs.organizationId, organizations.id))
        .leftJoin(institutions, eq(institutions.organizationId, organizations.id))
        .where(eq(userRoles.userId, user.id));

      const [student] = await db
        .select({
          hubId: students.hubId,
          id: students.id,
          institutionId: students.institutionId,
        })
        .from(students)
        .where(eq(students.userId, user.id))
        .limit(1);

      return {
        ...user,
        roles: roles.map((role) => ({
          hubId: role.hubId ?? role.institutionHubId ?? student?.hubId ?? null,
          institutionId: role.institutionId ?? student?.institutionId ?? null,
          organizationId: role.organizationId,
          organizationName: role.organizationName ?? "Unscoped",
          organizationType: role.organizationType ?? "global",
          role: role.role,
        })),
        studentId: student?.id ?? null,
      };
    },
  };
}
