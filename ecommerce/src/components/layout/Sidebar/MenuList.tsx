import NavItem from "./NavItem";
import {
  UserIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  HeartIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface MenuListProps {
  pathname: string;
}

export default function MenuList({ pathname }: MenuListProps) {
  const menuItems: MenuItem[] = [
    { href: "/profile", icon: UserIcon, label: "Perfil" },
    {
      href: "/infomedical",
      icon: DocumentTextIcon,
      label: "Información Médica",
    },
    {
      href: "/security/changePassword",
      icon: ShieldCheckIcon,
      label: "Seguridad",
    },
    {
      href: "/payments",
      icon: CurrencyDollarIcon,
      label: "Historial de pagos",
    },
    { href: "/wishlist", icon: HeartIcon, label: "Mi Wishlist" },
  ];

  return (
    <nav>
      <p className="mb-2 px-4 text-xs font-semibold uppercase text-gray-400">
        Menú
      </p>

      <ul className="space-y-1">
        {menuItems.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={pathname === href}
          />
        ))}
      </ul>
    </nav>
  );
}
