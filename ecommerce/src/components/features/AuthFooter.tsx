import { Link } from "@/i18n/routing";
import { colors } from "@/styles/styles";
import React from "react";
import { cn } from "@/lib/utils";

interface AuthFooterProps {
  text: string;
  linkText: string;
  href: string;
  replace?: boolean;
  className?: string;
}

const AuthFooter: React.FC<AuthFooterProps> = ({
  text,
  linkText,
  href,
  replace,
  className,
}) => {
  return (
    <div
      className={cn(
        "text-sm font-medium text-muted-foreground flex items-center gap-1.5 transition-all",
        className,
      )}
    >
      <span>{text}</span>
      <Link
        href={href}
        replace={replace}
        style={{ color: colors.primary }}
        className="font-bold hover:underline underline-offset-4 decoration-2 transition-all active:opacity-70"
      >
        {linkText}
      </Link>
    </div>
  );
};

export default AuthFooter;
