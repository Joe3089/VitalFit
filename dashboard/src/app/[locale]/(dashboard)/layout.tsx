
import { SidebarProvider } from "@/components/ui/sidebar";
import MainContent from "@/components/layout/MainContent";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SidebarDashboard from "@/components/layout/sidebar/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SidebarDashboard />
        <MainContent>{children}</MainContent>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
