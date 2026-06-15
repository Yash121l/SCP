import { ShieldCheck } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className={size === "sm" ? "brand-mark small" : "brand-mark"} aria-hidden="true">
      <ShieldCheck size={size === "sm" ? 18 : 22} />
    </div>
  );
}

