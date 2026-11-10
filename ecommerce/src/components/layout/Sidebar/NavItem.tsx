import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default function NavItem({ href, icon: Icon, label, isActive }: any) {
  return (
    <li>
      <Link href={href} className="block">
        <div
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-4 transition-all",
            isActive
              ? "bg-gray-900 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <Icon
            className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")}
          />
          <span className="font-medium">{label}</span>

          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          )}
        </div>
      </Link>
    </li>
  );
}
