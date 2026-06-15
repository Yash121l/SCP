# API Routes

Base URL: `http://localhost:4000/api`

The server accepts an httpOnly `scp_session` cookie from browser login. For scripts, capture the cookie with `curl -c`.

## Auth

```bash
curl -i -c .cookies \
  -H 'content-type: application/json' \
  -d '{"email":"gov.main@scp.local","password":"Demo@12345"}' \
  http://localhost:4000/api/auth/login

curl -b .cookies http://localhost:4000/api/auth/me

curl -b .cookies -X POST http://localhost:4000/api/auth/logout
```

## Dashboard

Requires `dashboard:read`.

```bash
curl -b .cookies http://localhost:4000/api/dashboard
```

## Schools

Read requires `institutions:read`; create and status updates require `institutions:manage`.

```bash
curl -b .cookies http://localhost:4000/api/institutions

curl -b .cookies \
  -H 'content-type: application/json' \
  -d '{
    "name": "New Saksham School",
    "type": "school",
    "region": "West Zone",
    "district": "Pilot District",
    "hubId": "<incubator-id>",
    "contactEmail": "school@example.gov.in",
    "principalName": "School Principal",
    "address": "Pilot District",
    "status": "onboarding",
    "studentCount": 120,
    "projectCount": 12
  }' \
  http://localhost:4000/api/institutions

curl -b .cookies \
  -X PATCH \
  -H 'content-type: application/json' \
  -d '{"status":"active"}' \
  http://localhost:4000/api/institutions/<institution-id>/status
```

## Governance Approvals

List requires `governance:read`; create requires `governance:manage`; decisions require `approvals:review`.

```bash
curl -b .cookies http://localhost:4000/api/governance/approvals

curl -b .cookies \
  -H 'content-type: application/json' \
  -d '{
    "title": "Monthly incubator report",
    "module": "Reports",
    "owner": "Mangalore Saksham Incubator",
    "assignedRole": "incubator",
    "dueAt": "2026-06-30"
  }' \
  http://localhost:4000/api/governance/approvals

curl -b .cookies \
  -X PATCH \
  -H 'content-type: application/json' \
  -d '{"status":"approved","decisionNote":"Reviewed and accepted."}' \
  http://localhost:4000/api/governance/approvals/<approval-id>/decision
```

## Projects

Read requires `projects:read`; create and status updates require `projects:manage`. Create also writes audit evidence and creates a steering approval.

```bash
curl -b .cookies http://localhost:4000/api/projects

curl -b .cookies \
  -H 'content-type: application/json' \
  -d '{
    "title": "Smart Water Use Monitor",
    "domain": "Water and sanitation",
    "institutionId": "<school-id>",
    "studentId": "<student-id>",
    "problemStatement": "School taps are left open during breaks.",
    "solutionSummary": "A sensor and student dashboard flags abnormal water usage."
  }' \
  http://localhost:4000/api/projects

curl -b .cookies http://localhost:4000/api/projects/<project-id>

curl -b .cookies \
  -X PATCH \
  -H 'content-type: application/json' \
  -d '{"status":"in_progress","reviewNote":"Pilot approved for implementation."}' \
  http://localhost:4000/api/projects/<project-id>/status
```

## Audit

Requires `audit:read`.

```bash
curl -b .cookies http://localhost:4000/api/audit
```
