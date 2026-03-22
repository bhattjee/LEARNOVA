/** Public email domains permitted for self-service signup (keep in sync with backend). */
export const ALLOWED_SIGNUP_EMAIL_DOMAINS = new Set<string>([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "ymail.com",
  "rocketmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "hey.com",
  "fastmail.com",
]);

const DOMAIN_ERROR =
  "Please use an email from a supported provider (e.g. Gmail, Outlook, or Yahoo).";

/**
 * Returns an error message if the address is missing @, has no domain, or the domain
 * is not in the allowlist; otherwise null.
 */
export function getSignupEmailDomainError(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return "Enter a valid email address.";
  }
  const domain = trimmed.slice(at + 1);
  if (!ALLOWED_SIGNUP_EMAIL_DOMAINS.has(domain)) {
    return DOMAIN_ERROR;
  }
  return null;
}
