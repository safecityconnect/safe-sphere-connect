import { Shield } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
};

const sizeStyles = {
  sm: { icon: "h-6 w-6", text: "text-base" },
  md: { icon: "h-8 w-8", text: "text-lg" },
  lg: { icon: "h-10 w-10", text: "text-xl" },
};

export function Logo({ size = "md", showText = true, href = "/", className }: LogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center rounded-xl bg-primary p-1.5 text-white shadow-sm shadow-primary/30">
        <Shield className={styles.icon} />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", styles.text)}>
          {APP_NAME}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
