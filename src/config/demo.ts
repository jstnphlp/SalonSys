// This release is a standalone demo. Real authentication/database access is an
// explicit deployment choice, never inferred from the presence of credentials.
export function isDemoMode() {
  return process.env.SALONSYS_DEMO_MODE !== "false";
}

export function usesHostedDemoStorage() {
  return process.env.VERCEL === "1";
}
