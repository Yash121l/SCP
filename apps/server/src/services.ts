import type { CookieSerializeOptions } from "@fastify/cookie";
import type { DatabaseClient } from "@scp/database";
import { env } from "./config/env.js";
import { createAuditRepository } from "./modules/audit/audit.repository.js";
import { createAuditService } from "./modules/audit/audit.service.js";
import { createAuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import { createAuthTokens } from "./modules/auth/auth.tokens.js";
import { createDashboardService } from "./modules/dashboard/dashboard.service.js";
import { createIndicatorRepository } from "./modules/dashboard/indicator.repository.js";
import { createCurriculumRepository } from "./modules/curriculum/curriculum.repository.js";
import { createCurriculumService } from "./modules/curriculum/curriculum.service.js";
import { createExpertRepository } from "./modules/experts/experts.repository.js";
import { createExpertService } from "./modules/experts/experts.service.js";
import { createGovernanceRepository } from "./modules/governance/governance.repository.js";
import { createGovernanceService } from "./modules/governance/governance.service.js";
import { createHubRepository } from "./modules/hubs/hubs.repository.js";
import { createHubService } from "./modules/hubs/hubs.service.js";
import { createInstitutionRepository } from "./modules/institutions/institutions.repository.js";
import { createInstitutionService } from "./modules/institutions/institutions.service.js";
import { createNotificationRepository } from "./modules/notifications/notifications.repository.js";
import { createNotificationService } from "./modules/notifications/notifications.service.js";
import { createPeopleRepository } from "./modules/people/people.repository.js";
import { createPeopleService } from "./modules/people/people.service.js";
import { createProjectRepository } from "./modules/projects/projects.repository.js";
import { createProjectService } from "./modules/projects/projects.service.js";
import { createSearchRepository } from "./modules/search/search.repository.js";
import { createSearchService } from "./modules/search/search.service.js";
import { createStudentRepository } from "./modules/students/students.repository.js";
import { createStudentService } from "./modules/students/students.service.js";

export function createServices(
  db: DatabaseClient,
  options: { sessionCookieOptions: CookieSerializeOptions },
) {
  const audit = createAuditService(createAuditRepository(db));
  const auth = createAuthService({
    repository: createAuthRepository(db),
    sessionCookieOptions: options.sessionCookieOptions,
    tokens: createAuthTokens(env.JWT_SECRET),
  });
  const hubs = createHubService({
    audit,
    repository: createHubRepository(db),
  });
  const institutions = createInstitutionService({
    audit,
    repository: createInstitutionRepository(db),
  });
  const people = createPeopleService({
    audit,
    repository: createPeopleRepository(db),
  });
  const students = createStudentService({
    audit,
    repository: createStudentRepository(db),
  });
  const governance = createGovernanceService({
    audit,
    repository: createGovernanceRepository(db),
  });
  const curriculum = createCurriculumService({
    audit,
    repository: createCurriculumRepository(db),
  });
  const experts = createExpertService({
    audit,
    repository: createExpertRepository(db),
  });
  const projects = createProjectService({
    audit,
    governance,
    repository: createProjectRepository(db),
  });
  const indicators = createIndicatorRepository(db);
  const notifications = createNotificationService(createNotificationRepository(db));
  const search = createSearchService(createSearchRepository(db));
  const dashboard = createDashboardService({
    audit,
    curriculum,
    experts,
    governance,
    hubs,
    indicators,
    institutions,
    notifications,
    people,
    projects,
    students,
  });

  return {
    audit,
    auth,
    curriculum,
    dashboard,
    experts,
    governance,
    hubs,
    indicators,
    institutions,
    notifications,
    people,
    projects,
    search,
    students,
  };
}

export type Services = ReturnType<typeof createServices>;
