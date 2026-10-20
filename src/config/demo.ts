// Explicit opt-in: missing production credentials must never enable demo access.
export function isDemoMode() {
  return process.env.SALONSYS_DEMO_MODE === "true";
}
