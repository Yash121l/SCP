import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginRoute } from "./routes/login/route.js";
import { CurriculumRoute } from "./routes/workspace/curriculum/route.js";
import { CurriculumDetailRoute } from "./routes/workspace/curriculum/detail-route.js";
import { ExpertsRoute } from "./routes/workspace/experts/route.js";
import { AuditRoute } from "./routes/workspace/audit/route.js";
import { DashboardRoute } from "./routes/workspace/dashboard/route.js";
import { GovernanceRoute } from "./routes/workspace/governance/route.js";
import { HubCreateRoute } from "./routes/workspace/hubs/create-route.js";
import { HubDetailRoute } from "./routes/workspace/hubs/detail-route.js";
import { HubsRoute } from "./routes/workspace/hubs/route.js";
import { InstitutionCreateRoute } from "./routes/workspace/institutions/create-route.js";
import { InstitutionDetailRoute } from "./routes/workspace/institutions/detail-route.js";
import { InstitutionsRoute } from "./routes/workspace/institutions/route.js";
import { WorkspaceLayoutRoute } from "./routes/workspace/layout.js";
import { EmployeeCreateRoute } from "./routes/workspace/people/create-route.js";
import { PeopleRoute } from "./routes/workspace/people/route.js";
import { ProfileRoute } from "./routes/workspace/profile/route.js";
import { ProjectCreateRoute } from "./routes/workspace/projects/create-route.js";
import { ProjectDetailRoute } from "./routes/workspace/projects/detail-route.js";
import { ProjectsRoute } from "./routes/workspace/projects/route.js";
import { StudentCreateRoute } from "./routes/workspace/students/create-route.js";
import { StudentDetailRoute } from "./routes/workspace/students/detail-route.js";
import { StudentsRoute } from "./routes/workspace/students/route.js";
import { UpdatesRoute } from "./routes/workspace/updates/route.js";
import { RequireAuth } from "../features/auth/require-auth.js";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/workspace"
          element={
            <RequireAuth>
              <WorkspaceLayoutRoute />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/workspace/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRoute />} />
          <Route path="hubs" element={<HubsRoute />} />
          <Route path="hubs/new" element={<HubCreateRoute />} />
          <Route path="hubs/:hubId" element={<HubDetailRoute />} />
          <Route path="institutions" element={<InstitutionsRoute />} />
          <Route path="institutions/new" element={<InstitutionCreateRoute />} />
          <Route path="institutions/:institutionId" element={<InstitutionDetailRoute />} />
          <Route path="people" element={<PeopleRoute />} />
          <Route path="people/new" element={<EmployeeCreateRoute />} />
          <Route path="curriculum" element={<CurriculumRoute />} />
          <Route path="curriculum/:curriculumId" element={<CurriculumDetailRoute />} />
          <Route path="projects" element={<ProjectsRoute />} />
          <Route path="projects/new" element={<ProjectCreateRoute />} />
          <Route path="projects/:projectId" element={<ProjectDetailRoute />} />
          <Route path="updates" element={<UpdatesRoute />} />
          <Route path="students" element={<StudentsRoute />} />
          <Route path="students/new" element={<StudentCreateRoute />} />
          <Route path="students/:studentId" element={<StudentDetailRoute />} />
          <Route path="governance" element={<GovernanceRoute />} />
          <Route path="experts" element={<ExpertsRoute />} />
          <Route path="profile" element={<ProfileRoute />} />
          <Route path="audit" element={<AuditRoute />} />
        </Route>
        <Route path="*" element={<Navigate to="/workspace/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
