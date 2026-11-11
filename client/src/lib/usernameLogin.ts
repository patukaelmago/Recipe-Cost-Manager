// Firebase email/password auth needs an email, so plain usernames
// (for people without an email address) map to an internal address.
// Nothing is ever sent to this domain.
export const USERNAME_EMAIL_DOMAIN = "sucre.com";

export function usernameToEmail(input: string): string {
  const value = input.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${USERNAME_EMAIL_DOMAIN}`;
}
