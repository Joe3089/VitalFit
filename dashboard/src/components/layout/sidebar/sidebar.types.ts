import { ComponentType } from "react";
import { UserRole } from "@/lib/roles"; 
export interface SubItem {
  label: string;
  href: string; 
}

export interface NavItemBase {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string; 
}

export interface NavItemSimple extends NavItemBase {
  href: string; 
  subitems?: never; 
}

export interface NavItemWithSub extends NavItemBase {
  subitems: SubItem[];
  href?: never; 
}

export type NavItem = NavItemSimple | NavItemWithSub;

export interface NavSection {
  title?: string; 
  items: NavItem[];
}

export type SidebarConfig = Record<UserRole, NavSection[]>;