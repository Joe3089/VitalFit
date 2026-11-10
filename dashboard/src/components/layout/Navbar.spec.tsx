import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("Navbar Component", () => {
  it("renders correctly inside provider", () => {
    render(
      <SidebarProvider>
        <Navbar />
      </SidebarProvider>,
    );
  });
});
