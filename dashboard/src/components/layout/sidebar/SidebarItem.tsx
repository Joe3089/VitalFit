import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { NavItem, NavItemWithSub } from "./sidebar.types";
import { ChevronDown } from "lucide-react";

interface Props {
  item: NavItem;
  pathname: string;
  onNavigate: (href: string) => void;
  t: (key: string) => string; 
}
export const hasSubItems = (item: NavItem): item is NavItemWithSub => "subitems" in item;

export function SidebarItem({ item, pathname, onNavigate, t }: Props) {
  const isActive = hasSubItems(item)
    ? item.subitems.some((sub) => pathname.startsWith(sub.href))
    : item.href === pathname;
  
  const translatedLabel = t(item.label as any); 
  
  if (hasSubItems(item)) {
    return (
      <Collapsible defaultOpen={isActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              data-active={isActive}
              className="justify-between" 
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span>{translatedLabel}</span>
              </div>
              <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subitems.map((sub) => {
                const translatedSubLabel = t(sub.label as any); 
                return (
                  <SidebarMenuSubItem key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={() => onNavigate(sub.href)}
                      className={`block px-2 py-1 rounded-md text-sm transition-colors ${pathname === sub.href
                        ? " text-orange-400 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {translatedSubLabel}
                    </Link>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
      >
        <Link
          href={item.href}
          onClick={() => onNavigate(item.href)}
          className="justify-start" 
        >
          <item.icon className="h-4 w-4" />
          <span>{translatedLabel}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}