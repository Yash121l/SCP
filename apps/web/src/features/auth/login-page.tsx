import { useState } from "react";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Landmark,
  LockKeyhole,
  Network,
  School,
  Users,
  Zap,
  UserRoundCheck,
} from "lucide-react";
import { Badge, Button } from "@scp/ui";
import { BrandMark } from "../../components/brand/brand-mark.js";
import { ThemeToggle } from "../../components/theme/theme-toggle.js";
import { useAuth } from "./auth-context.js";

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("gov.main@scp.local");
  const [password, setPassword] = useState("Demo@12345");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInAs(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("Demo@12345");
    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(nextEmail, "Demo@12345");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  const demos = [
    { email: "gov.main@scp.local", icon: Landmark, label: "Government main" },
    { email: "steering@scp.local", icon: ClipboardCheck, label: "Steering" },
    { email: "incubator@scp.local", icon: Network, label: "Incubator" },
    { email: "incubator.employee@scp.local", icon: Users, label: "Incubator employee" },
    { email: "school@scp.local", icon: School, label: "School" },
    { email: "student@scp.local", icon: GraduationCap, label: "Student" },
    { email: "expert@scp.local", icon: UserRoundCheck, label: "External expert" },
  ];

  const stats = [
    { icon: Network, label: "Incubators", value: "2 live" },
    { icon: School, label: "Schools mapped", value: "3" },
    { icon: BarChart3, label: "Student records", value: "870" },
  ];

  const modules = [
    "C4 learning",
    "Studio clusters",
    "School teams",
    "Student projects",
    "Expert feedback",
    "Governance queue",
    "Audit trail",
  ];

  return (
    <main className="login-screen">
      <aside className="login-context" aria-label="Portal scope">
        <div className="brand-lockup">
          <BrandMark />
          <div>
            <strong>SAKSHAM Portal</strong>
            <span>Programme Operating System</span>
          </div>
        </div>

        <div className="login-copy">
          <p className="eyebrow">Secure programme operations</p>
          <h1>Innovation clusters under one command layer.</h1>
          <p>
            Government, steering committee, incubators, schools and students work from the same scoped data,
            approval and audit surface.
          </p>
        </div>

        <div className="login-stats">
          {stats.map(({ icon: Icon, label, value }) => (
            <div className="login-stat" key={label}>
              <Icon size={15} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="login-module-panel">
          <p className="eyebrow">What's inside</p>
          <div>
            {modules.map((module) => (
              <span key={module}>{module}</span>
            ))}
          </div>
        </div>

        <div className="context-row">
          <Zap size={16} />
          <span>SAKSHAM C4 model: classroom, corridor, campus and community evidence in one workflow.</span>
        </div>
      </aside>

      <section className="login-panel" aria-label="Sign in">
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="login-panel-heading">
          <div className="brand-lockup mobile-brand">
            <BrandMark />
            <div>
              <strong>SAKSHAM Portal</strong>
              <span>Programme Operating System</span>
            </div>
          </div>
          <div>
            <h2>Sign in</h2>
            <p>Access your role-scoped workspace</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <LockKeyhole size={16} />
            {isSubmitting ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <div className="login-footnote">
          <Badge tone="blue">Demo password</Badge>
          <span>Demo@12345</span>
        </div>

        <div className="demo-section">
          <div className="panel-title">
            <Building2 size={16} />
            <strong>Demo roles</strong>
          </div>
        <div className="demo-grid">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <button
                className="demo-card"
                disabled={isSubmitting}
                key={demo.email}
                onClick={() => void signInAs(demo.email)}
                type="button"
                title={`Sign in as ${demo.label}`}
              >
                <Icon size={18} />
                <strong>{demo.label}</strong>
                <span>{demo.email}</span>
              </button>
            );
          })}
        </div>
        </div>

        <div className="context-row">
          <ClipboardCheck size={16} />
          <span>Role and organization scope are enforced by the API before data is returned.</span>
        </div>
      </section>
    </main>
  );
}
