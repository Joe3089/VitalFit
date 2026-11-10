import { render, screen } from "@testing-library/react";
import LoginPage from "../page";
import React from "react";

// Mock de next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "es",
}));

// Mock completo de @clerk/nextjs
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    signOut: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
  }),
  useSignIn: () => ({
    isLoaded: true,
    signIn: jest.fn(),
    setActive: jest.fn(),
  }),
  useClerkAuth: () => ({
    getToken: jest.fn(),
    isSignedIn: false,
    signOut: jest.fn(),
    userId: null,
  }),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  UserButton: () => <div>Mock User Button</div>,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock del router de Next.js
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock de i18n routing - VERSIÓN CORREGIDA
jest.mock("@/i18n/routing", () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => "/login"),
  Link: ({ href, children, replace, ...props }: any) => {
    // Filtrar la prop 'replace' para que no se pase al elemento <a>
    const filteredProps = { ...props };
    delete filteredProps.replace;

    return (
      <a href={href} {...filteredProps}>
        {children}
      </a>
    );
  },
}));

describe("Login Page", () => {
  it("should render the login form with simulated translation keys", () => {
    render(<LoginPage />);

    const heading = screen.getByRole("heading", { name: /title/i });
    expect(heading).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/email.placeholder/i);
    expect(emailInput).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(/password.placeholder/i);
    expect(passwordInput).toBeInTheDocument();

    const submitButton = screen.getByRole("button", {
      name: /submitButton.default/i,
    });
    expect(submitButton).toBeInTheDocument();

    const googleButton = screen.getByRole("button", { name: /googleLogin/i });
    expect(googleButton).toBeInTheDocument();

    const rememberMeLabelText = screen.getByText(/rememberMe/i);
    expect(rememberMeLabelText).toBeInTheDocument();

    const recoverLink = screen.getByRole("link", {
      name: /forgotPassword.link/i,
    });
    expect(recoverLink).toBeInTheDocument();

    const registerLink = screen.getByRole("link", { name: /noAccount.link/i });
    expect(registerLink).toBeInTheDocument();

    const allCheckboxes = screen.getAllByRole("checkbox");
    expect(allCheckboxes.length).toBeGreaterThan(0);

    const rememberMeCheckbox = screen.getByLabelText(/rememberMe/i);
    expect(rememberMeCheckbox).toBeInTheDocument();
  });
});
