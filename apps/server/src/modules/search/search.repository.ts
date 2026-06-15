import {
  approvals,
  curriculumAssignments,
  curriculumModules,
  hubEmployees,
  incubationHubs,
  institutions,
  studentProjects,
  students,
  type DatabaseClient,
} from "@scp/database";
import type { SearchResult } from "@scp/contracts";
import { and, asc, eq, ilike, or } from "drizzle-orm";

type SearchScope = {
  canSeeAll: boolean;
  hubId: string | null;
  institutionId?: string | null;
  studentId?: string | null;
};

function pattern(query: string) {
  return `%${query || ""}%`;
}

export function createSearchRepository(db: DatabaseClient) {
  return {
    async search(query: string, scope: SearchScope): Promise<SearchResult[]> {
      const term = pattern(query);
      const hubWhere = scope.canSeeAll
        ? or(ilike(incubationHubs.name, term), ilike(incubationHubs.code, term))
        : and(eq(incubationHubs.id, scope.hubId ?? ""), or(ilike(incubationHubs.name, term), ilike(incubationHubs.code, term)));

      const institutionScope = scope.canSeeAll
        ? undefined
        : scope.institutionId
          ? eq(institutions.id, scope.institutionId)
          : eq(institutions.hubId, scope.hubId ?? "");

      const studentScope = scope.canSeeAll
        ? undefined
        : scope.studentId
          ? eq(students.id, scope.studentId)
          : scope.institutionId
            ? eq(students.institutionId, scope.institutionId)
            : eq(students.hubId, scope.hubId ?? "");

      const projectScope = scope.canSeeAll
        ? undefined
        : scope.studentId
          ? eq(studentProjects.studentId, scope.studentId)
          : scope.institutionId
            ? eq(studentProjects.institutionId, scope.institutionId)
            : eq(studentProjects.hubId, scope.hubId ?? "");

      const employeeScope = scope.canSeeAll
        ? undefined
        : scope.institutionId
          ? eq(hubEmployees.institutionId, scope.institutionId)
            : eq(hubEmployees.hubId, scope.hubId ?? "");

      const curriculumScope = scope.canSeeAll
        ? undefined
        : scope.hubId
          ? eq(curriculumAssignments.hubId, scope.hubId)
          : eq(curriculumAssignments.hubId, "");

      const [hubs, institutionRows, employeeRows, studentRows, projectRows, curriculumRows, approvalRows] = await Promise.all([
        db
          .select({ code: incubationHubs.code, id: incubationHubs.id, name: incubationHubs.name, region: incubationHubs.region })
          .from(incubationHubs)
          .where(hubWhere)
          .orderBy(asc(incubationHubs.name))
          .limit(5),
        db
          .select({ district: institutions.district, id: institutions.id, name: institutions.name, type: institutions.type })
          .from(institutions)
          .where(and(institutionScope, or(ilike(institutions.name, term), ilike(institutions.code, term))))
          .orderBy(asc(institutions.name))
          .limit(6),
        db
          .select({ designation: hubEmployees.designation, id: hubEmployees.id, name: hubEmployees.name })
          .from(hubEmployees)
          .where(and(employeeScope, or(ilike(hubEmployees.name, term), ilike(hubEmployees.email, term))))
          .orderBy(asc(hubEmployees.name))
          .limit(6),
        db
          .select({ grade: students.grade, id: students.id, name: students.name })
          .from(students)
          .where(and(studentScope, or(ilike(students.name, term), ilike(students.email, term))))
          .orderBy(asc(students.name))
          .limit(6),
        db
          .select({ domain: studentProjects.domain, id: studentProjects.id, ownerName: studentProjects.ownerName, title: studentProjects.title })
          .from(studentProjects)
          .where(
            and(
              projectScope,
              or(
                ilike(studentProjects.title, term),
                ilike(studentProjects.domain, term),
                ilike(studentProjects.ownerName, term),
              ),
            ),
          )
          .orderBy(asc(studentProjects.title))
          .limit(6),
        db
          .select({
            code: curriculumModules.code,
            domain: curriculumModules.domain,
            hubName: incubationHubs.name,
            id: curriculumAssignments.id,
            title: curriculumModules.title,
          })
          .from(curriculumAssignments)
          .innerJoin(curriculumModules, eq(curriculumAssignments.moduleId, curriculumModules.id))
          .innerJoin(incubationHubs, eq(curriculumAssignments.hubId, incubationHubs.id))
          .where(
            and(
              curriculumScope,
              or(
                ilike(curriculumModules.title, term),
                ilike(curriculumModules.code, term),
                ilike(curriculumModules.domain, term),
                ilike(incubationHubs.name, term),
              ),
            ),
          )
          .orderBy(asc(curriculumModules.code))
          .limit(6),
        db
          .select({ id: approvals.id, module: approvals.module, title: approvals.title })
          .from(approvals)
          .where(or(ilike(approvals.title, term), ilike(approvals.module, term)))
          .orderBy(asc(approvals.dueAt))
          .limit(scope.canSeeAll ? 4 : 0),
      ]);

      return [
        ...hubs.map((hub): SearchResult => ({
          id: hub.id,
          label: hub.name,
          meta: `${hub.code} · ${hub.region}`,
          path: `/workspace/hubs/${hub.id}`,
          type: "hub",
        })),
        ...institutionRows.map((institution): SearchResult => ({
          id: institution.id,
          label: institution.name,
          meta: `${institution.type} · ${institution.district}`,
          path: `/workspace/institutions/${institution.id}`,
          type: "institution",
        })),
        ...employeeRows.map((employee): SearchResult => ({
          id: employee.id,
          label: employee.name,
          meta: employee.designation,
          path: "/workspace/people",
          type: "employee",
        })),
        ...studentRows.map((student): SearchResult => ({
          id: student.id,
          label: student.name,
          meta: student.grade,
          path: `/workspace/students/${student.id}`,
          type: "student",
        })),
        ...projectRows.map((project): SearchResult => ({
          id: project.id,
          label: project.title,
          meta: `${project.domain} · ${project.ownerName}`,
          path: `/workspace/projects/${project.id}`,
          type: "project",
        })),
        ...curriculumRows.map((curriculum): SearchResult => ({
          id: curriculum.id,
          label: curriculum.title,
          meta: `${curriculum.code} · ${curriculum.hubName} · ${curriculum.domain}`,
          path: `/workspace/curriculum/${curriculum.id}`,
          type: "curriculum",
        })),
        ...approvalRows.map((approval): SearchResult => ({
          id: approval.id,
          label: approval.title,
          meta: approval.module,
          path: "/workspace/governance",
          type: "approval",
        })),
      ];
    },
  };
}
