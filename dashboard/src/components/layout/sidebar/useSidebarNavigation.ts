import { usePathname, useRouter } from "@/i18n/navigation";


export function useSidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navigate = (href: string) => {
    const currentModule = pathname.split("/")[1];
    const targetModule = href.split("/")[1];

    if (currentModule && targetModule && currentModule !== targetModule) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };

  return { pathname, navigate };
}