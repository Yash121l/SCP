# Implementation Plan

## Current Goal

Make the SCP portal a complete SAKSHAM operating surface in the style of FundOS, with only these roles:

- Government main
- Steering committee
- Incubator
- Incubator employee
- School
- Student

## Product Shape

- Government main: statewide dashboard, incubator and school hierarchy, student visibility, governance approvals and audit.
- Steering committee: statewide read/review surface, approvals queue, reports and audit visibility.
- Incubator: manage assigned incubator, mapped schools, employees, students and governance items.
- Incubator employee: operate within assigned incubator, support schools and manage student records where permitted.
- School: view own school, manage own student records and see assigned employees.
- Student: view own profile, school, incubator and student project record.
- Projects: scoped users raise projects, steering sees approval work, and permitted operators update status with audit evidence.

## Execution Track

| Area | Status | Notes |
|---|---|---|
| Reference review | Done | FundOS/SOLU, live FundOS sign-in UX and SAKSHAM PDF reviewed. |
| Decision log | Done | `SOLD.md` restored as the canonical project decision log. |
| Role model | Done | Contracts now expose six roles and backend scope helpers understand school/student scoping. |
| Seed data | Done | Demo hierarchy uses government main, steering committee, incubators, schools, employees and students. |
| UI vocabulary | Done | Main navigation and views use incubator/school language while route paths remain stable. |
| FundOS-style shell | Done | Sign-in and workspace shell now use compact dark operational styling. |
| FundOS component analysis | Done | Actual FundOS shell, portfolio table/detail and updates sheet components reviewed. See `docs/fundos-sitemap-flow-ux.md`. |
| Sitemap and flows | Done | Role-specific sitemap and route-level `/new` creation flows are documented and implemented. |
| Project workflow | Done | Projects are first-class records with create, list, detail, status update, steering approval creation, search and audit logs. |
| Verification | Done | `pnpm typecheck`, `pnpm build`, smoke, and Browser desktop/mobile checks passed. |

## Verification Checklist

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke` if a database is available
- Browser check: login screen desktop and mobile
- Browser check: authenticated dashboard desktop and mobile
- Browser check: school role cannot see global data beyond its scope
- Browser check: incubator role does not see the global Incubators tab
- Browser check: Add School opens `/workspace/institutions/new` and create navigates to school detail
- Browser check: Projects opens `/workspace/projects`, Raise project opens `/workspace/projects/new`, create navigates to project detail
- Browser check: Project status updates write audit logs and the generated approval appears in Governance
