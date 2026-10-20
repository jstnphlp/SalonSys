"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { demoPeople } from "../seed";
import { resetDemoAction, switchDemoAccountAction } from "../actions";
export function DemoToolbar({ userId }: { userId: string }) {
  const [pending, start] = useTransition(),
    router = useRouter();
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-950"
      data-no-print
    >
      <p>
        <strong>Demo mode</strong> · Sample data saved locally
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="demo-account">
          View demo as
        </label>
        <Select
          id="demo-account"
          aria-label="View demo as"
          className="w-auto max-w-full bg-white text-xs"
          value={userId}
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            start(async () => {
              await switchDemoAccountAction(id);
            });
          }}
        >
          {demoPeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <ConfirmationDialog
          trigger={
            <Button variant="outline" size="sm" disabled={pending}>
              Reset demo
            </Button>
          }
          title="Reset demo data?"
          description="Replace local demo changes with the sample hair salon and nail studio. This resets the shared demo for everyone using this local server."
          confirmLabel="Reset demo"
          onConfirm={async () => {
            const result = await resetDemoAction();
            if (result.status === "success") {
              router.push("/dashboard");
              router.refresh();
              return true;
            }
            return false;
          }}
        />
      </div>
    </div>
  );
}
