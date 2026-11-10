import { sidebarMenusByRole } from "@/components/layout/sidebar/sidebar.config";
import { UserRole } from "@/lib/roles";

export function getSearchableItems(role: UserRole) {
  const menu = sidebarMenusByRole[role] || [];
  const flatItems: { label: string; href: string; section: string }[] = [];

  menu.forEach((section) => {
    const sectionTitle = section.title ?? "General";

    section.items.forEach((item) => {
      if (item.subitems) {
        item.subitems.forEach((sub) => {
          flatItems.push({
            label: sub.label, // Asegúrate que aquí llegue "ReporteFinanciero" y no "Sidebar.ReporteFinanciero"
            href: sub.href,
            section: sectionTitle,
          });
        });
      } else if (item.href) {
        flatItems.push({
          label: item.label,
          href: item.href,
          section: sectionTitle,
        });
      }
    });
  });

  return flatItems;
}
