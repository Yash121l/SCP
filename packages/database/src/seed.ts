import "dotenv/config";
import { roleLabels, type ProgrammeRole } from "@scp/contracts";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDatabase } from "./client.js";
import {
  approvals,
  curriculumAssignments,
  auditLogs,
  curriculumModules,
  curriculumProgress,
  curriculumStages,
  curriculumStageStudents,
  externalExperts,
  hubEmployees,
  incubationHubs,
  indicators,
  institutions,
  notifications,
  projectFeedback,
  organizations,
  studentProjects,
  students,
  userRoles,
  users,
} from "./schema.js";

type OrganizationSeed = {
  slug: string;
  name: string;
  type: "government" | "steering_committee" | "hub" | "institution" | "partner";
  region: string;
};

type UserSeed = {
  email: string;
  name: string;
  role: ProgrammeRole;
  organizationSlug: string;
};

type HubSeed = {
  code: string;
  district: string;
  geographyNote: string;
  latitude: number;
  longitude: number;
  name: string;
  organizationSlug: string;
  performanceScore: number;
  region: string;
  status: "active" | "onboarding" | "attention" | "archived";
  leadEmail?: string;
};

type InstitutionSeed = {
  address: string;
  code: string;
  contactEmail: string;
  district: string;
  employeeCount: number;
  geographyNote: string;
  hubCode: string;
  latitude: number;
  longitude: number;
  name: string;
  organizationSlug: string;
  performanceScore: number;
  principalName: string;
  projectCount: number;
  region: string;
  status: "active" | "onboarding" | "attention" | "archived";
  studentCount: number;
  type: "school" | "college" | "polytechnic" | "iti";
};

type EmployeeSeed = {
  designation: string;
  email: string;
  hubCode: string;
  institutionCode?: string;
  name: string;
  phone: string;
  status?: "active" | "invited" | "suspended";
  userEmail?: string;
};

type StudentSeed = {
  email: string;
  grade: string;
  institutionCode: string;
  mentorEmail?: string;
  name: string;
  projectCount: number;
  status?: "active" | "paused" | "graduated";
  userEmail?: string;
};

type ProjectSeed = {
  domain: string;
  institutionCode: string;
  ownerEmail?: string;
  ownerName?: string;
  problemStatement: string;
  reviewNote?: string;
  solutionSummary: string;
  status: "proposed" | "under_review" | "approved" | "in_progress" | "on_hold" | "completed" | "rejected";
  studentEmail?: string;
  title: string;
};

type CurriculumModuleSeed = {
  code: string;
  domain: string;
  gradeBand: string;
  sessionCount: number;
  title: string;
};

type CurriculumProgressSeed = {
  completedSessions: number;
  institutionCode: string;
  moduleCode: string;
  nextTopic: string;
  plannedSessions: number;
};

type CurriculumAssignmentSeed = {
  completedSessions: number;
  hubCode: string;
  moduleCode: string;
  nextTopic: string;
  ownerEmail: string;
  plannedSessions: number;
  status: "planned" | "active" | "at_risk" | "completed";
};

type CurriculumStageSeed = {
  assignmentModuleCode: string;
  completedSessions: number;
  hubCode: string;
  learnerEmails: string[];
  nextTopic: string;
  plannedSessions: number;
  projectTitle?: string;
  sequence: number;
  status: "planned" | "active" | "at_risk" | "completed";
  title: string;
};

type ExpertSeed = {
  email: string;
  focusArea: string;
  name: string;
  organization: string;
  organizationSlug: string;
  status: "active" | "invited" | "suspended";
  userEmail?: string;
};

type FeedbackSeed = {
  expertEmail: string;
  note: string;
  projectTitle: string;
  rating: number;
};

const organizationSeeds: OrganizationSeed[] = [
  {
    slug: "government-main",
    name: "Government Main Office",
    type: "government",
    region: "State-wide",
  },
  {
    slug: "steering-committee",
    name: "State Steering Committee",
    type: "steering_committee",
    region: "State-wide",
  },
  {
    slug: "expert-partners",
    name: "Saksham External Expert Panel",
    type: "partner",
    region: "State-wide",
  },
  {
    slug: "north-hub",
    name: "Mangalore Saksham Incubator",
    type: "hub",
    region: "Coastal Zone",
  },
  {
    slug: "east-hub",
    name: "Mysuru Saksham Incubator",
    type: "hub",
    region: "South Zone",
  },
  {
    slug: "model-school",
    name: "Model Government High School",
    type: "institution",
    region: "Coastal Zone",
  },
  {
    slug: "river-school",
    name: "River Valley Public School",
    type: "institution",
    region: "Coastal Zone",
  },
  {
    slug: "hill-school",
    name: "Hill District Residential School",
    type: "institution",
    region: "South Zone",
  },
];

const userSeeds: UserSeed[] = [
  {
    email: "gov.main@scp.local",
    name: "Asha Government Main",
    organizationSlug: "government-main",
    role: "government_main",
  },
  {
    email: "steering@scp.local",
    name: "Vikram Steering Member",
    organizationSlug: "steering-committee",
    role: "steering_committee",
  },
  {
    email: "incubator@scp.local",
    name: "Arjun Incubator Lead",
    organizationSlug: "north-hub",
    role: "incubator",
  },
  {
    email: "incubator.employee@scp.local",
    name: "Rhea Incubator Employee",
    organizationSlug: "north-hub",
    role: "incubator_employee",
  },
  {
    email: "school@scp.local",
    name: "Kavita School Champion",
    organizationSlug: "model-school",
    role: "school",
  },
  {
    email: "student@scp.local",
    name: "Naina Student",
    organizationSlug: "model-school",
    role: "student",
  },
  {
    email: "expert@scp.local",
    name: "Meera External Expert",
    organizationSlug: "expert-partners",
    role: "external_expert",
  },
];

const hubSeeds: HubSeed[] = [
  {
    code: "NORTH-HUB",
    district: "Dakshina Kannada",
    geographyNote: "Mangaluru coastal cluster covering urban and peri-urban schools",
    latitude: 12.9141,
    leadEmail: "incubator@scp.local",
    longitude: 74.856,
    name: "Mangalore Saksham Incubator",
    organizationSlug: "north-hub",
    performanceScore: 86,
    region: "Coastal Zone",
    status: "active",
  },
  {
    code: "EAST-HUB",
    district: "Mysuru",
    geographyNote: "Mysuru learning cluster for residential and semi-urban schools",
    latitude: 12.2958,
    longitude: 76.6394,
    name: "Mysuru Saksham Incubator",
    organizationSlug: "east-hub",
    performanceScore: 68,
    region: "South Zone",
    status: "attention",
  },
];

const institutionSeeds: InstitutionSeed[] = [
  {
    address: "12 Learning Road, Hampankatta, Mangaluru",
    code: "MODEL-SCH",
    contactEmail: "principal.model@scp.local",
    district: "Dakshina Kannada",
    employeeCount: 2,
    geographyNote: "Urban government high school close to Mangaluru city transport corridor",
    hubCode: "NORTH-HUB",
    latitude: 12.8703,
    longitude: 74.8427,
    name: "Model Government High School",
    organizationSlug: "model-school",
    performanceScore: 91,
    principalName: "Kavita Sharma",
    projectCount: 34,
    region: "Coastal Zone",
    status: "active",
    studentCount: 420,
    type: "school",
  },
  {
    address: "4 River Campus Road, Ullal, Mangaluru",
    code: "RIVER-SCH",
    contactEmail: "office.river@scp.local",
    district: "Dakshina Kannada",
    employeeCount: 1,
    geographyNote: "Coastal suburban school with strong accessibility project pipeline",
    hubCode: "NORTH-HUB",
    latitude: 12.805,
    longitude: 74.8608,
    name: "River Valley Public School",
    organizationSlug: "river-school",
    performanceScore: 73,
    principalName: "Devika Rao",
    projectCount: 22,
    region: "Coastal Zone",
    status: "onboarding",
    studentCount: 260,
    type: "school",
  },
  {
    address: "7 Hill Workshop Lane, Chamundi foothills, Mysuru",
    code: "HILL-SCH",
    contactEmail: "director.south@scp.local",
    district: "Mysuru",
    employeeCount: 1,
    geographyNote: "Residential school serving hill-side and rural catchment areas",
    hubCode: "EAST-HUB",
    latitude: 12.2423,
    longitude: 76.6599,
    name: "Hill District Residential School",
    organizationSlug: "hill-school",
    performanceScore: 62,
    principalName: "Farah Khan",
    projectCount: 18,
    region: "South Zone",
    status: "attention",
    studentCount: 190,
    type: "school",
  },
];

const employeeSeeds: EmployeeSeed[] = [
  {
    designation: "Incubator Director",
    email: "incubator@scp.local",
    hubCode: "NORTH-HUB",
    name: "Arjun Incubator Lead",
    phone: "+91-90000-10001",
    userEmail: "incubator@scp.local",
  },
  {
    designation: "Studio Programme Officer",
    email: "incubator.employee@scp.local",
    hubCode: "NORTH-HUB",
    institutionCode: "MODEL-SCH",
    name: "Rhea Incubator Employee",
    phone: "+91-90000-10002",
    userEmail: "incubator.employee@scp.local",
  },
  {
    designation: "School Champion",
    email: "school@scp.local",
    hubCode: "NORTH-HUB",
    institutionCode: "MODEL-SCH",
    name: "Kavita School Champion",
    phone: "+91-90000-10003",
    userEmail: "school@scp.local",
  },
  {
    designation: "Saksham Champion",
    email: "iqbal.champion@scp.local",
    hubCode: "NORTH-HUB",
    institutionCode: "RIVER-SCH",
    name: "Iqbal Khan",
    phone: "+91-90000-10004",
  },
  {
    designation: "Hub Lead",
    email: "east.lead@scp.local",
    hubCode: "EAST-HUB",
    name: "Priya East Lead",
    phone: "+91-90000-20001",
  },
  {
    designation: "Saksham Champion",
    email: "anil.champion@scp.local",
    hubCode: "EAST-HUB",
    institutionCode: "HILL-SCH",
    name: "Anil Menon",
    phone: "+91-90000-20002",
  },
  {
    designation: "Student Coordinator",
    email: "sara.coordinator@scp.local",
    hubCode: "EAST-HUB",
    institutionCode: "HILL-SCH",
    name: "Sara Thomas",
    phone: "+91-90000-20003",
  },
];

const studentSeeds: StudentSeed[] = [
  {
    email: "student@scp.local",
    grade: "Grade 10",
    institutionCode: "MODEL-SCH",
    mentorEmail: "incubator.employee@scp.local",
    name: "Naina Student",
    projectCount: 2,
    userEmail: "student@scp.local",
  },
  {
    email: "kabir.student@scp.local",
    grade: "Grade 9",
    institutionCode: "MODEL-SCH",
    mentorEmail: "school@scp.local",
    name: "Kabir Singh",
    projectCount: 1,
  },
  {
    email: "diya.student@scp.local",
    grade: "Grade 11",
    institutionCode: "MODEL-SCH",
    mentorEmail: "incubator.employee@scp.local",
    name: "Diya Patel",
    projectCount: 3,
  },
  {
    email: "aarav.student@scp.local",
    grade: "Grade 8",
    institutionCode: "RIVER-SCH",
    mentorEmail: "iqbal.champion@scp.local",
    name: "Aarav Rao",
    projectCount: 1,
  },
  {
    email: "tanya.student@scp.local",
    grade: "Grade 12",
    institutionCode: "HILL-SCH",
    mentorEmail: "anil.champion@scp.local",
    name: "Tanya Das",
    projectCount: 2,
    status: "paused",
  },
];

const projectSeeds: ProjectSeed[] = [
  {
    domain: "Water and sanitation",
    institutionCode: "MODEL-SCH",
    problemStatement:
      "School taps are left open during breaks, creating avoidable water loss and unreliable maintenance signals.",
    reviewNote: "Prototype needs steering review before pilot budget is released.",
    solutionSummary:
      "A low-cost sensor and classroom dashboard that flags abnormal usage and assigns student maintenance follow-ups.",
    status: "under_review",
    studentEmail: "student@scp.local",
    title: "Smart Water Use Monitor",
  },
  {
    domain: "Accessibility",
    institutionCode: "RIVER-SCH",
    problemStatement:
      "Visitors and new students struggle to find labs, offices, and safety points across the campus.",
    solutionSummary:
      "QR-enabled wayfinding markers with multilingual directions and an admin sheet for school staff updates.",
    status: "proposed",
    studentEmail: "aarav.student@scp.local",
    title: "Inclusive Campus Wayfinding",
  },
  {
    domain: "Circular economy",
    institutionCode: "HILL-SCH",
    problemStatement:
      "Reusable packaging and paper waste from the residential block is not being tracked or converted into learning activities.",
    reviewNote: "Incubator employee is monitoring material sourcing before completion review.",
    solutionSummary:
      "A student-run waste-to-art studio with weekly inventory, local mentor sessions, and public exhibition milestones.",
    status: "in_progress",
    studentEmail: "tanya.student@scp.local",
    title: "Local Waste-to-Art Studio",
  },
];

const curriculumModuleSeeds: CurriculumModuleSeed[] = [
  {
    code: "C4-06-FOUND",
    domain: "C4 Foundations",
    gradeBand: "Grades 6-8",
    sessionCount: 12,
    title: "Observe, ask and map local problems",
  },
  {
    code: "C4-09-PROT",
    domain: "Prototype Studio",
    gradeBand: "Grades 9-10",
    sessionCount: 16,
    title: "Build, test and document working prototypes",
  },
  {
    code: "C4-11-VENT",
    domain: "Venture Readiness",
    gradeBand: "Grades 11-12",
    sessionCount: 14,
    title: "Pitch, partner and plan implementation",
  },
];

const curriculumProgressSeeds: CurriculumProgressSeed[] = [
  {
    completedSessions: 9,
    institutionCode: "MODEL-SCH",
    moduleCode: "C4-09-PROT",
    nextTopic: "Field testing and evidence capture",
    plannedSessions: 16,
  },
  {
    completedSessions: 5,
    institutionCode: "MODEL-SCH",
    moduleCode: "C4-11-VENT",
    nextTopic: "Budget and partner mapping",
    plannedSessions: 14,
  },
  {
    completedSessions: 4,
    institutionCode: "RIVER-SCH",
    moduleCode: "C4-06-FOUND",
    nextTopic: "Campus problem walk",
    plannedSessions: 12,
  },
  {
    completedSessions: 10,
    institutionCode: "HILL-SCH",
    moduleCode: "C4-09-PROT",
    nextTopic: "Mentor critique round",
    plannedSessions: 16,
  },
];

const curriculumAssignmentSeeds: CurriculumAssignmentSeed[] = [
  {
    completedSessions: 11,
    hubCode: "NORTH-HUB",
    moduleCode: "C4-09-PROT",
    nextTopic: "Evidence capture and prototype iteration",
    ownerEmail: "incubator.employee@scp.local",
    plannedSessions: 16,
    status: "active",
  },
  {
    completedSessions: 5,
    hubCode: "NORTH-HUB",
    moduleCode: "C4-06-FOUND",
    nextTopic: "Community problem walk and interview notes",
    ownerEmail: "iqbal.champion@scp.local",
    plannedSessions: 12,
    status: "active",
  },
  {
    completedSessions: 8,
    hubCode: "EAST-HUB",
    moduleCode: "C4-11-VENT",
    nextTopic: "Partner pitch and pilot plan",
    ownerEmail: "sara.coordinator@scp.local",
    plannedSessions: 14,
    status: "at_risk",
  },
];

const curriculumStageSeeds: CurriculumStageSeed[] = [
  {
    assignmentModuleCode: "C4-09-PROT",
    completedSessions: 4,
    hubCode: "NORTH-HUB",
    learnerEmails: ["student@scp.local", "kabir.student@scp.local", "diya.student@scp.local"],
    nextTopic: "Document field signals",
    plannedSessions: 4,
    projectTitle: "Smart Water Use Monitor",
    sequence: 1,
    status: "completed",
    title: "Prototype build sprint",
  },
  {
    assignmentModuleCode: "C4-09-PROT",
    completedSessions: 4,
    hubCode: "NORTH-HUB",
    learnerEmails: ["student@scp.local", "diya.student@scp.local"],
    nextTopic: "Compare baseline readings",
    plannedSessions: 5,
    projectTitle: "Smart Water Use Monitor",
    sequence: 2,
    status: "active",
    title: "Field testing and evidence",
  },
  {
    assignmentModuleCode: "C4-09-PROT",
    completedSessions: 3,
    hubCode: "NORTH-HUB",
    learnerEmails: ["student@scp.local", "diya.student@scp.local"],
    nextTopic: "Prepare steering committee review",
    plannedSessions: 7,
    projectTitle: "Smart Water Use Monitor",
    sequence: 3,
    status: "active",
    title: "Iteration and review pack",
  },
  {
    assignmentModuleCode: "C4-06-FOUND",
    completedSessions: 5,
    hubCode: "NORTH-HUB",
    learnerEmails: ["aarav.student@scp.local"],
    nextTopic: "Visitor journey interviews",
    plannedSessions: 12,
    projectTitle: "Inclusive Campus Wayfinding",
    sequence: 1,
    status: "active",
    title: "Observe and map campus problems",
  },
  {
    assignmentModuleCode: "C4-11-VENT",
    completedSessions: 8,
    hubCode: "EAST-HUB",
    learnerEmails: ["tanya.student@scp.local"],
    nextTopic: "CSR partner budget review",
    plannedSessions: 14,
    projectTitle: "Local Waste-to-Art Studio",
    sequence: 1,
    status: "at_risk",
    title: "Pitch, partner and pilot",
  },
];

const expertSeeds: ExpertSeed[] = [
  {
    email: "expert@scp.local",
    focusArea: "Water, IoT and school infrastructure",
    name: "Meera External Expert",
    organization: "Saksham External Expert Panel",
    organizationSlug: "expert-partners",
    status: "active",
    userEmail: "expert@scp.local",
  },
  {
    email: "csr.partner@scp.local",
    focusArea: "CSR partnerships and venture readiness",
    name: "Rohan CSR Partner",
    organization: "Future Skills Foundation",
    organizationSlug: "expert-partners",
    status: "invited",
  },
  {
    email: "design.mentor@scp.local",
    focusArea: "Inclusive design and accessibility",
    name: "Ananya Design Mentor",
    organization: "Access Labs",
    organizationSlug: "expert-partners",
    status: "active",
  },
];

const feedbackSeeds: FeedbackSeed[] = [
  {
    expertEmail: "expert@scp.local",
    note: "Pilot is promising. Add a baseline reading and maintenance escalation path before district rollout.",
    projectTitle: "Smart Water Use Monitor",
    rating: 4,
  },
  {
    expertEmail: "design.mentor@scp.local",
    note: "Good accessibility angle. Test QR copy with younger students and visitors before printing all markers.",
    projectTitle: "Inclusive Campus Wayfinding",
    rating: 5,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL ?? "postgres://scp:scp@localhost:5432/scp_portal";
  const { db, pool } = createDatabase(connectionString);
  const passwordHash = await bcrypt.hash("Demo@12345", 12);

  try {
    const orgIds = new Map<string, string>();
    const userIds = new Map<string, string>();
    const hubIds = new Map<string, string>();
    const institutionIds = new Map<string, string>();
    const employeeIds = new Map<string, string>();
    const expertIds = new Map<string, string>();
    const assignmentIds = new Map<string, string>();
    const moduleIds = new Map<string, string>();
    const projectIds = new Map<string, string>();
    const studentIds = new Map<string, string>();

    for (const seed of organizationSeeds) {
      const [record] = await db
        .insert(organizations)
        .values(seed)
        .onConflictDoUpdate({
          target: organizations.slug,
          set: {
            name: seed.name,
            region: seed.region,
            type: seed.type,
            updatedAt: new Date(),
          },
        })
        .returning({ id: organizations.id });

      if (record) {
        orgIds.set(seed.slug, record.id);
      }
    }

    for (const seed of userSeeds) {
      const [user] = await db
        .insert(users)
        .values({
          email: seed.email,
          name: seed.name,
          passwordHash,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: seed.name,
            passwordHash,
            status: "active",
            updatedAt: new Date(),
          },
        })
        .returning({ id: users.id });

      const organizationId = orgIds.get(seed.organizationSlug);
      if (!user || !organizationId) {
        throw new Error(`Could not seed ${seed.email}`);
      }

      userIds.set(seed.email, user.id);

      await db
        .insert(userRoles)
        .values({
          organizationId,
          role: seed.role,
          scopeLabel: roleLabels[seed.role],
          userId: user.id,
        })
        .onConflictDoNothing();
    }

    for (const seed of hubSeeds) {
      const organizationId = orgIds.get(seed.organizationSlug);
      if (!organizationId) {
        throw new Error(`Missing organization for ${seed.code}`);
      }

      const [hub] = await db
        .insert(incubationHubs)
        .values({
          code: seed.code,
          district: seed.district,
          geographyNote: seed.geographyNote,
          latitude: seed.latitude,
          leadUserId: seed.leadEmail ? userIds.get(seed.leadEmail) : undefined,
          longitude: seed.longitude,
          name: seed.name,
          organizationId,
          performanceScore: seed.performanceScore,
          region: seed.region,
          status: seed.status,
        })
        .onConflictDoUpdate({
          target: incubationHubs.code,
          set: {
            district: seed.district,
            geographyNote: seed.geographyNote,
            latitude: seed.latitude,
            leadUserId: seed.leadEmail ? userIds.get(seed.leadEmail) : null,
            longitude: seed.longitude,
            name: seed.name,
            performanceScore: seed.performanceScore,
            region: seed.region,
            status: seed.status,
            updatedAt: new Date(),
          },
        })
        .returning({ id: incubationHubs.id });

      if (hub) {
        hubIds.set(seed.code, hub.id);
      }
    }

    for (const seed of institutionSeeds) {
      const hubId = hubIds.get(seed.hubCode);
      const organizationId = orgIds.get(seed.organizationSlug);
      if (!hubId || !organizationId) {
        throw new Error(`Missing hub or organization for ${seed.code}`);
      }

      const [institution] = await db
        .insert(institutions)
        .values({
          address: seed.address,
          code: seed.code,
          contactEmail: seed.contactEmail,
          district: seed.district,
          employeeCount: seed.employeeCount,
          geographyNote: seed.geographyNote,
          hubId,
          latitude: seed.latitude,
          longitude: seed.longitude,
          name: seed.name,
          organizationId,
          performanceScore: seed.performanceScore,
          principalName: seed.principalName,
          projectCount: seed.projectCount,
          region: seed.region,
          status: seed.status,
          studentCount: seed.studentCount,
          type: seed.type,
        })
        .onConflictDoUpdate({
          target: institutions.code,
          set: {
            address: seed.address,
            contactEmail: seed.contactEmail,
            district: seed.district,
            employeeCount: seed.employeeCount,
            geographyNote: seed.geographyNote,
            hubId,
            latitude: seed.latitude,
            longitude: seed.longitude,
            name: seed.name,
            organizationId,
            performanceScore: seed.performanceScore,
            principalName: seed.principalName,
            projectCount: seed.projectCount,
            region: seed.region,
            status: seed.status,
            studentCount: seed.studentCount,
            type: seed.type,
            updatedAt: new Date(),
          },
        })
        .returning({ id: institutions.id });

      if (institution) {
        institutionIds.set(seed.code, institution.id);
      }
    }

    for (const seed of employeeSeeds) {
      const hubId = hubIds.get(seed.hubCode);
      const institutionId = seed.institutionCode ? institutionIds.get(seed.institutionCode) : undefined;
      if (!hubId) {
        throw new Error(`Missing hub for ${seed.email}`);
      }

      const [employee] = await db
        .insert(hubEmployees)
        .values({
          designation: seed.designation,
          email: seed.email,
          hubId,
          institutionId,
          name: seed.name,
          phone: seed.phone,
          status: seed.status ?? "active",
          userId: seed.userEmail ? userIds.get(seed.userEmail) : undefined,
        })
        .onConflictDoUpdate({
          target: hubEmployees.email,
          set: {
            designation: seed.designation,
            hubId,
            institutionId: institutionId ?? null,
            name: seed.name,
            phone: seed.phone,
            status: seed.status ?? "active",
            updatedAt: new Date(),
            userId: seed.userEmail ? userIds.get(seed.userEmail) ?? null : null,
          },
        })
        .returning({ id: hubEmployees.id });

      if (employee) {
        employeeIds.set(seed.email, employee.id);
      }
    }

    for (const seed of studentSeeds) {
      const institutionSeed = institutionSeeds.find((institution) => institution.code === seed.institutionCode);
      const institutionId = institutionIds.get(seed.institutionCode);
      const hubId = institutionSeed ? hubIds.get(institutionSeed.hubCode) : undefined;
      if (!hubId || !institutionId) {
        throw new Error(`Missing institution for ${seed.email}`);
      }

      const [student] = await db
        .insert(students)
        .values({
          email: seed.email,
          grade: seed.grade,
          hubId,
          institutionId,
          mentorEmployeeId: seed.mentorEmail ? employeeIds.get(seed.mentorEmail) : undefined,
          name: seed.name,
          projectCount: seed.projectCount,
          status: seed.status ?? "active",
          userId: seed.userEmail ? userIds.get(seed.userEmail) : undefined,
        })
        .onConflictDoUpdate({
          target: students.email,
          set: {
            grade: seed.grade,
            hubId,
            institutionId,
            mentorEmployeeId: seed.mentorEmail ? employeeIds.get(seed.mentorEmail) ?? null : null,
            name: seed.name,
            projectCount: seed.projectCount,
            status: seed.status ?? "active",
            updatedAt: new Date(),
            userId: seed.userEmail ? userIds.get(seed.userEmail) ?? null : null,
          },
        })
        .returning({ id: students.id });

      if (student) {
        studentIds.set(seed.email, student.id);
      }
    }

    for (const seed of projectSeeds) {
      const institutionSeed = institutionSeeds.find((institution) => institution.code === seed.institutionCode);
      const institutionId = institutionIds.get(seed.institutionCode);
      const hubId = institutionSeed ? hubIds.get(institutionSeed.hubCode) : undefined;
      const studentSeed = seed.studentEmail
        ? studentSeeds.find((student) => student.email === seed.studentEmail)
        : undefined;
      const studentId = seed.studentEmail ? studentIds.get(seed.studentEmail) : undefined;

      if (!hubId || !institutionId || !institutionSeed) {
        throw new Error(`Missing institution for project ${seed.title}`);
      }

      const [project] = await db
        .insert(studentProjects)
        .values({
          createdByUserId: userIds.get("gov.main@scp.local"),
          domain: seed.domain,
          hubId,
          institutionId,
          ownerEmail: seed.ownerEmail ?? studentSeed?.email ?? institutionSeed.contactEmail,
          ownerName: seed.ownerName ?? studentSeed?.name ?? institutionSeed.name,
          problemStatement: seed.problemStatement,
          reviewNote: seed.reviewNote,
          solutionSummary: seed.solutionSummary,
          status: seed.status,
          studentId,
          title: seed.title,
        })
        .onConflictDoUpdate({
          target: [studentProjects.title, studentProjects.institutionId, studentProjects.ownerEmail],
          set: {
            domain: seed.domain,
            hubId,
            problemStatement: seed.problemStatement,
            reviewNote: seed.reviewNote ?? null,
            solutionSummary: seed.solutionSummary,
            status: seed.status,
            studentId: studentId ?? null,
            updatedAt: new Date(),
          },
        })
        .returning({ id: studentProjects.id });

      if (project) {
        projectIds.set(seed.title, project.id);
      }
    }

    for (const seed of curriculumModuleSeeds) {
      const [module] = await db
        .insert(curriculumModules)
        .values({
          code: seed.code,
          domain: seed.domain,
          gradeBand: seed.gradeBand,
          sessionCount: seed.sessionCount,
          title: seed.title,
        })
        .onConflictDoUpdate({
          target: curriculumModules.code,
          set: {
            domain: seed.domain,
            gradeBand: seed.gradeBand,
            sessionCount: seed.sessionCount,
            title: seed.title,
            updatedAt: new Date(),
          },
        })
        .returning({ id: curriculumModules.id });

      if (module) {
        moduleIds.set(seed.code, module.id);
      }
    }

    for (const seed of curriculumProgressSeeds) {
      const institutionSeed = institutionSeeds.find((institution) => institution.code === seed.institutionCode);
      const hubId = institutionSeed ? hubIds.get(institutionSeed.hubCode) : undefined;
      const institutionId = institutionIds.get(seed.institutionCode);
      const moduleId = moduleIds.get(seed.moduleCode);

      if (!hubId || !institutionId || !moduleId) {
        throw new Error(`Missing curriculum scope for ${seed.institutionCode}/${seed.moduleCode}`);
      }

      await db
        .insert(curriculumProgress)
        .values({
          completedSessions: seed.completedSessions,
          hubId,
          institutionId,
          moduleId,
          nextTopic: seed.nextTopic,
          plannedSessions: seed.plannedSessions,
        })
        .onConflictDoUpdate({
          target: [curriculumProgress.institutionId, curriculumProgress.moduleId],
          set: {
            completedSessions: seed.completedSessions,
            hubId,
            nextTopic: seed.nextTopic,
            plannedSessions: seed.plannedSessions,
            updatedAt: new Date(),
          },
        });
    }

    for (const seed of curriculumAssignmentSeeds) {
      const hubId = hubIds.get(seed.hubCode);
      const moduleId = moduleIds.get(seed.moduleCode);
      const ownerEmployeeId = employeeIds.get(seed.ownerEmail);

      if (!hubId || !moduleId) {
        throw new Error(`Missing curriculum assignment scope for ${seed.hubCode}/${seed.moduleCode}`);
      }

      const [assignment] = await db
        .insert(curriculumAssignments)
        .values({
          completedSessions: seed.completedSessions,
          hubId,
          moduleId,
          nextTopic: seed.nextTopic,
          ownerEmployeeId,
          plannedSessions: seed.plannedSessions,
          status: seed.status,
        })
        .onConflictDoUpdate({
          target: [curriculumAssignments.hubId, curriculumAssignments.moduleId],
          set: {
            completedSessions: seed.completedSessions,
            nextTopic: seed.nextTopic,
            ownerEmployeeId: ownerEmployeeId ?? null,
            plannedSessions: seed.plannedSessions,
            status: seed.status,
            updatedAt: new Date(),
          },
        })
        .returning({ id: curriculumAssignments.id });

      if (assignment) {
        assignmentIds.set(`${seed.hubCode}:${seed.moduleCode}`, assignment.id);
      }
    }

    for (const seed of curriculumStageSeeds) {
      const assignmentId = assignmentIds.get(`${seed.hubCode}:${seed.assignmentModuleCode}`);
      if (!assignmentId) {
        throw new Error(`Missing curriculum assignment for ${seed.hubCode}/${seed.assignmentModuleCode}`);
      }

      const [stage] = await db
        .insert(curriculumStages)
        .values({
          assignmentId,
          completedSessions: seed.completedSessions,
          nextTopic: seed.nextTopic,
          plannedSessions: seed.plannedSessions,
          sequence: seed.sequence,
          status: seed.status,
          title: seed.title,
        })
        .onConflictDoUpdate({
          target: [curriculumStages.assignmentId, curriculumStages.sequence],
          set: {
            completedSessions: seed.completedSessions,
            nextTopic: seed.nextTopic,
            plannedSessions: seed.plannedSessions,
            status: seed.status,
            title: seed.title,
            updatedAt: new Date(),
          },
        })
        .returning({ id: curriculumStages.id });

      if (!stage) {
        continue;
      }

      const projectId = seed.projectTitle ? projectIds.get(seed.projectTitle) : undefined;

      for (const learnerEmail of seed.learnerEmails) {
        const studentId = studentIds.get(learnerEmail);
        if (!studentId) {
          continue;
        }

        await db
          .insert(curriculumStageStudents)
          .values({
            evidenceNote:
              seed.status === "completed"
                ? "Stage evidence captured and reviewed by incubator employee"
                : "Mapped for current delivery cycle",
            projectId,
            stageId: stage.id,
            status: seed.status === "completed" ? "completed" : "in_progress",
            studentId,
          })
          .onConflictDoUpdate({
            target: [curriculumStageStudents.stageId, curriculumStageStudents.studentId],
            set: {
              evidenceNote:
                seed.status === "completed"
                  ? "Stage evidence captured and reviewed by incubator employee"
                  : "Mapped for current delivery cycle",
              projectId: projectId ?? null,
              status: seed.status === "completed" ? "completed" : "in_progress",
              updatedAt: new Date(),
            },
          });
      }
    }

    for (const seed of expertSeeds) {
      const organizationId = orgIds.get(seed.organizationSlug);
      if (!organizationId) {
        throw new Error(`Missing expert organization for ${seed.email}`);
      }

      const [expert] = await db
        .insert(externalExperts)
        .values({
          email: seed.email,
          focusArea: seed.focusArea,
          name: seed.name,
          organization: seed.organization,
          organizationId,
          status: seed.status,
          userId: seed.userEmail ? userIds.get(seed.userEmail) : undefined,
        })
        .onConflictDoUpdate({
          target: externalExperts.email,
          set: {
            focusArea: seed.focusArea,
            name: seed.name,
            organization: seed.organization,
            organizationId,
            status: seed.status,
            updatedAt: new Date(),
            userId: seed.userEmail ? userIds.get(seed.userEmail) ?? null : null,
          },
        })
        .returning({ id: externalExperts.id });

      if (expert) {
        expertIds.set(seed.email, expert.id);
      }
    }

    for (const seed of feedbackSeeds) {
      const expert = expertSeeds.find((item) => item.email === seed.expertEmail);
      const projectId = projectIds.get(seed.projectTitle);
      if (!expert || !projectId) {
        throw new Error(`Missing project feedback seed for ${seed.projectTitle}`);
      }

      await db.insert(projectFeedback).values({
        actorUserId: userIds.get(seed.expertEmail),
        expertId: expertIds.get(seed.expertEmail),
        expertName: expert.name,
        expertOrganization: expert.organization,
        note: seed.note,
        projectId,
        rating: seed.rating,
      });
    }

    const governmentOrgId = orgIds.get("government-main");
    const northHubOrgId = orgIds.get("north-hub");

    await db
      .insert(approvals)
      .values([
        {
          assignedRole: "steering_committee",
          dueAt: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
          module: "Governance",
          organizationId: governmentOrgId,
          owner: "State Steering Committee",
          status: "pending",
          title: "Approve incubator operating calendar",
        },
        {
          assignedRole: "incubator",
          dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          module: "Institution Setup",
          organizationId: northHubOrgId,
          owner: "Mangalore Saksham Incubator",
          status: "returned",
          title: "River Valley school champion roster correction",
        },
        {
          assignedRole: "steering_committee",
          dueAt: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
          module: "Student Operations",
          organizationId: governmentOrgId,
          owner: "Government Body",
          status: "pending",
          title: "Review student data sanity exceptions",
        },
      ])
      .onConflictDoNothing();

    for (const indicator of [
      { label: "Incubators active", target: "4", unit: "count", value: "2" },
      { label: "Schools mapped to incubators", target: "20", unit: "count", value: "3" },
      { label: "Students with active records", target: "1000", unit: "count", value: "870" },
      { label: "Governance actions closed", target: "90", unit: "percent", value: "82" },
      { label: "Curriculum completion", target: "100", unit: "percent", value: "58" },
      { label: "Expert reviews logged", target: "20", unit: "count", value: "2" },
    ]) {
      await db
        .insert(indicators)
        .values(indicator)
        .onConflictDoUpdate({
          target: indicators.label,
          set: {
            target: indicator.target,
            unit: indicator.unit,
            updatedAt: new Date(),
            value: indicator.value,
          },
        });
    }

    await db.insert(notifications).values([
      {
        body: "Two incubators have updated school and student rosters ready for committee review.",
        role: "steering_committee",
        title: "Roster review ready",
      },
      {
        body: "River Valley Public School returned a champion roster correction task.",
        role: "incubator",
        title: "Institution setup returned",
      },
      {
        body: "Your student cohort has three records missing mentor confirmation.",
        role: "incubator_employee",
        title: "Mentor confirmation needed",
      },
      {
        body: "Your school workspace is scoped to Model Government High School.",
        role: "school",
        title: "School workspace ready",
      },
      {
        body: "Your profile and institution details are available in the portal.",
        role: "student",
        title: "Student workspace ready",
      },
      {
        body: "Two projects are ready for partner feedback and institutional support notes.",
        role: "external_expert",
        title: "Expert review queue ready",
      },
      {
        body: "State-level hierarchy seed completed with government, steering, hubs, institutions and students.",
        userId: userIds.get("government@scp.local"),
        title: "Demo data loaded",
      },
    ]);

    const [governmentUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, "gov.main@scp.local"))
      .limit(1);

    await db.insert(auditLogs).values([
      {
        action: "Seeded government-to-student Saksham hierarchy",
        actorName: governmentUser?.name ?? "Seed Script",
        actorUserId: governmentUser?.id,
        entityId: "seed-demo",
        entityType: "system",
        metadata: { source: "database-seed" },
      },
    ]);

    console.log("Seeded demo data. Login with gov.main@scp.local / Demo@12345");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
