import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AuthenticateWithRedirectCallback />
      {/* 
        This div is required for Clerk's custom flow bot protection.
        See: https://clerk.com/docs/custom-flows/bot-sign-up-protection
      */}
      <div id="clerk-captcha" />
    </div>
  );
}
