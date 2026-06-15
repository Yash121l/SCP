import type { FastifyInstance } from "fastify";
import type { Services } from "../services.js";
import { registerAuditRoutes } from "../modules/audit/audit.routes.js";
import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerDashboardRoutes } from "../modules/dashboard/dashboard.routes.js";
import { registerCurriculumRoutes } from "../modules/curriculum/curriculum.routes.js";
import { registerExpertRoutes } from "../modules/experts/experts.routes.js";
import { registerGovernanceRoutes } from "../modules/governance/governance.routes.js";
import { registerHubRoutes } from "../modules/hubs/hubs.routes.js";
import { registerInstitutionRoutes } from "../modules/institutions/institutions.routes.js";
import { registerNotificationRoutes } from "../modules/notifications/notifications.routes.js";
import { registerPeopleRoutes } from "../modules/people/people.routes.js";
import { registerProfileRoutes } from "../modules/profile/profile.routes.js";
import { registerProjectRoutes } from "../modules/projects/projects.routes.js";
import { registerSearchRoutes } from "../modules/search/search.routes.js";
import { registerStudentRoutes } from "../modules/students/students.routes.js";
import { registerHealthRoutes } from "./health.routes.js";

export async function registerRoutes(app: FastifyInstance, services: Services) {
  await registerHealthRoutes(app);

  await app.register(
    async (api) => {
      await registerAuthRoutes(api, services);
      await registerDashboardRoutes(api, services);
      await registerCurriculumRoutes(api, services);
      await registerHubRoutes(api, services);
      await registerInstitutionRoutes(api, services);
      await registerPeopleRoutes(api, services);
      await registerStudentRoutes(api, services);
      await registerProjectRoutes(api, services);
      await registerExpertRoutes(api, services);
      await registerGovernanceRoutes(api, services);
      await registerProfileRoutes(api, services);
      await registerNotificationRoutes(api, services);
      await registerSearchRoutes(api, services);
      await registerAuditRoutes(api, services);
    },
    { prefix: "/api" },
  );
}
