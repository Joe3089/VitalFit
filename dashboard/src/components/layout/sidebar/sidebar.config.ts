import { UserRole } from "@/lib/roles";

import { Calendar, ChartBar, UserIcon, Megaphone, DollarSign } from "lucide-react";

import {
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ChartBarIcon,
  HomeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

import { NavSection } from "./sidebar.types";

export const sidebarMenusByRole: Record<UserRole, NavSection[]> = {
  [UserRole.SUPER_ADMIN]: [
    {
      title: "General", 
      items: [
        { label: "Dashboard", icon: HomeIcon, href: "/" },
        { label: "Sucursales",  icon: BuildingStorefrontIcon, href: "/branches"}, 
      ],
    },
    {
      title: "Administracion", 
      items: [
        {
          label: "UsuariosRoles", 
          icon: UsersIcon,
          subitems: [
            { label: "UsuariosSistema", href: "/users/users" }, 
            { label: "RolesPermisos", href: "/users/roles" },
            { label: "AuditoriaAccesos", href: "/users/audit" },
          ],
        },
        {
          label: "CatalogoSistema", 
          icon: UsersIcon,
          subitems: [
            { label: "TiposMembresia",  href: "/catalog/memberships" },
            { label: "Servicios",  href: "/catalog/services" },
            { label: "Instructores", href: "/catalog/instructors" },
            { label: "InventarioEquipamiento",  href: "/catalog/equipment" },
            { label: "DocumentosFiscales", href: "/catalog/fiscal-documents" },
            { label: "MetodosPagoGlobal", href: "/catalog/payment-methods" },
            { label: "CausalesCancelacion", href: "/catalog/cancellation-reason" },
            { label: "CombosPaquetes", href: "/catalog/packages" },
          ],
        },
      ],
    },
    {
      title: "Operacion",
      items: [
        {
          label: "ClientesSocios", 
          icon: UserIcon,
          subitems: [
            { label: "RegistroConsulta", href: "/clients/register" }, 
            { label: "QuejasSugerencias", href: "/clients/feedback" },
          ],
        },
        {
          label: "CalendarioAsistencia",
          icon: Calendar,
          subitems: [
            { label: "CalendarioClases", href: "/operations/calendar" },
            { label: "GestionReservas", href: "/operations/reservations" },
          ],
        },
      ],
    },
    {
      title: "Finanzas",
      items: [
        { label: "FacturacionElectronica", icon: CurrencyDollarIcon, href: "/finance/billing" },
        {
          label: "MembresiasControl",
          icon: CurrencyDollarIcon,
          subitems: [
            { label: "GestionMembresias", href: "/finance/memberships" },
          ],
        },
        { label: "ReportesFinancieros",
          icon: ChartBarIcon, 
          subitems: [
            { label: "ReporteClientes", href: "/analytics/reports/clients" },
            { label: "ReporteFinanciero", href: "/analytics/reports/financial" },
            { label: "ReporteVentas", href: "/analytics/reports/sales" },
            { label: "AnaliticaAvanzada", href: "/analytics/insights" },
            { label: "AutomatizacionReportes", href: "/analytics/automation" },
          ],
        },
      ],
    },
    {
      title: "Marketing",
      items: [
         { 
          label: "GestionMarketing",
          icon: Megaphone, 
          subitems: [
            { label: "GestionBanners",  href: "/marketing/banners" },
            { label: "Promociones",href: "/marketing/promotions" },
          ],
        },
      ],
    },
    {
      title: "Configuracion", 
      items: [
        { 
            label: "AjustesSistema", 
            icon: Cog6ToothIcon, 
            subitems: [
                { label: "PoliticasComerciales", href: "/settings/commercial-policies" },
                { label: "PoliticasContrasena", href: "/settings/security" },
                
            ]
        },
      ],
    },
  ],

  [UserRole.BRANCH_ADMIN]: [
    {
      title: "General",
      items: [
        { label: "DashboardOperativo", icon: HomeIcon, href: "/" },
        
        {
          label: "ConfiguracionLocal",
          icon: BuildingStorefrontIcon,
          subitems: [
            { label: "InformacionHorarios", href: "/branches/active/edit", },
          ],
        },
      ],
    },
    {
      title: "Operacion",
      items: [
        { label: "ClientesSocios", icon: UserIcon, href: "/clients/register"},
        { label: "QuejasSugerencias", icon: Megaphone, href: "/clients/feedback" },
        { label: "AgendaCalendario", icon: Calendar, href: "/operations/calendar" },
        { label: "ReservasActivas", icon: Calendar, href: "/operations/reservations" },
      ],
    },
    {
      title: "Finanzas",
      items: [
        { label: "RegistroPagos", icon: CurrencyDollarIcon, href: "/finance/billing"},
        { label: "GestionMembresias", icon: CurrencyDollarIcon, href: "/finance/memberships" },
      ],
    },
    {
      title: "ReportesFinancieros",
      items: [
        { label: "ReporteClientes", icon: UserIcon, href: "/analytics/reports/clients" },
        { label: "ReporteFinanciero", icon: ChartBar, href: "/analytics/reports/financial"  },
        { label: "ReporteVentas", icon: ChartBar, href: "/analytics/reports/sales"  },
        { label: "AnaliticaAvanzada", icon: ChartBar, href: "/analytics/insights" },
      ],
    },
    
  ],

  [UserRole.INSTRUCTOR]: [
    {
      title: "Instructor",
      items: [
        { label: "Dashboard", icon: HomeIcon, href: "/" },
        { label: "MiCalendario", icon: Calendar, href:  "/operations/calendar" },
        { label: "MisClientes", icon: UsersIcon, href: "/instructor/clients" },
      ],
    },
  ],

 [UserRole.ACCOUNTANT]: [
    {
      title: "General",
      items: [
        { label: "Dashboard", icon: HomeIcon, href: "/" },
        { label: "RegistroConsulta", icon: UserIcon, href: "/clients/register" }, 
        { label: "FacturacionElectronica", icon: CurrencyDollarIcon, href: "/finance/billing" },
      ],
    },
    {
      title: "ReportesFinancieros",
      items: [
        { label: "ReporteClientes", icon: UserIcon, href: "/analytics/reports/clients" },
        { label: "ReporteFinanciero", icon: ChartBar, href: "/analytics/reports/financial"  },
        { label: "ReporteVentas", icon: ChartBar, href: "/analytics/reports/sales"  },
        { label: "AnaliticaAvanzada", icon: ChartBar, href: "/analytics/insights" },
        { label: "AutomatizacionReportes", icon: ChartBar, href: "/analytics/automation" },
      ],
    },
    
  ],

  [UserRole.DATA_ANALYST]: [
    {
      title: "ReportesFinancieros",
      items: [
        { label: "Dashboard", icon: HomeIcon, href: "/" },
        { label: "ReporteClientes", icon: UserIcon, href: "/analytics/reports/clients" },
        { label: "ReporteFinanciero", icon: ChartBar, href: "/analytics/reports/financial"  },
        { label: "ReporteVentas", icon: DollarSign, href: "/analytics/reports/sales"  },
        { label: "AnaliticaAvanzada", icon: ChartBar, href: "/analytics/insights" },
        { label: "AutomatizacionReportes", icon: ChartBar, href: "/analytics/automation" },
      ],
    },
  ],

  [UserRole.RECEPTIONIST]: [
    {
      title: "Recepcion",
      items: [
        { label: "Dashboard", icon: HomeIcon, href: "/" },
        { label: "ClientesSocios", icon: UsersIcon, href: "/clients/register"  },
        { label: "AgendaCalendario", icon: Calendar, href: "/operations/calendar" },
        { label: "ReservasActivas", icon: Calendar, href: "/operations/reservations" },
        { label: "QuejasSugerencias", icon: Megaphone, href: "/clients/feedback" },
      ],
    },
  ],
};