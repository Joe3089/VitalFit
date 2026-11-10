import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

const AuthCard = ({ children, className }: AuthCardProps) => {
  return (
    <div
      className={cn(
        "w-full mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10 w-full text-center">
        {children}
      </div>
    </div>
  );
};

export default AuthCard;
