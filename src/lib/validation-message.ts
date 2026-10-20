// Keep explicit product guidance, but don't display schema diagnostics to users.
// Used for both resolver errors and server-side validation responses.
export function validationMessage(message: unknown, label: string) {
  if (typeof message !== "string" || !message.trim()) {
    return `Check ${label.toLowerCase()} and try again.`;
  }
  if (/^Too small: expected string to have >=1 characters$/.test(message)) {
    return `${label} is required.`;
  }
  if (
    /^(Too (small|big):|Invalid (input|option|string|value|key|element):|Invalid (UUID|ISO |email|URL)|Unrecognized key)/.test(
      message,
    )
  ) {
    return `Check ${label.toLowerCase()} and try again.`;
  }
  return message;
}
