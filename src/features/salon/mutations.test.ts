import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/salon/queries", () => ({ requireSalon: vi.fn() }));
vi.mock("@/features/auth/authorization", () => ({
  requirePermission: vi.fn(),
  AuthorizationError: class extends Error {},
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { requireSalon } from "./queries";
import {
  requirePermission,
  AuthorizationError,
} from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { saveBookingAction } from "@/features/appointments/actions";
import { revalidatePath } from "next/cache";
const salon = "10000000-0000-4000-8000-000000000001";
const input = {
  staff_id: "40000000-0000-4000-8000-000000000001",
  customer_id: "",
  walk_in_name: "Walk-in",
  start_at: "2026-10-20T14:00",
  service_ids: ["30000000-0000-4000-8000-000000000001"],
  notes: "",
};
describe("salon server mutation boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireSalon).mockResolvedValue({
      id: salon,
      name: "Salon",
      slug: "salon",
      role: "admin",
    });
  });
  it("rejects malformed bookings before resolving identity or accessing data", async () => {
    expect(
      (await saveBookingAction({ ...input, service_ids: [] })).status,
    ).toBe("error");
    expect(requireSalon).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("does not mutate or revalidate after authorization denies access", async () => {
    vi.mocked(requirePermission).mockRejectedValue(new AuthorizationError());
    expect((await saveBookingAction(input)).status).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it("uses verified salon context, ignores a supplied tenant, and converts Manila input to UTC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "saved", error: null });
    vi.mocked(createClient).mockResolvedValue({ rpc } as unknown as Awaited<
      ReturnType<typeof createClient>
    >);
    expect(
      (
        await saveBookingAction({
          ...input,
          organizationId: "10000000-0000-4000-8000-000000000002",
        })
      ).status,
    ).toBe("success");
    expect(requirePermission).toHaveBeenCalledWith(
      "appointments:manage",
      salon,
    );
    expect(rpc).toHaveBeenCalledWith(
      "save_booking",
      expect.objectContaining({
        p_org: salon,
        p_data: expect.objectContaining({
          start_at: "2026-10-20T06:00:00.000Z",
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
