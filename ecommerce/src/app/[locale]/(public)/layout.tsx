import PwaRegister from "@/components/PwaRegister";
import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PwaRegister />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
