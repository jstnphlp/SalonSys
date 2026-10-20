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
      className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"
      data-no-print
    >
      <p className="rounded-md bg-muted px-2 py-1 text-[9px] font-semibold tracking-wide uppercase">
        <strong>Demo mode</strong>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="demo-account">
          View demo as
        </label>
        <Select
          id="demo-account"
          aria-label="View demo as"
          className="h-8 w-auto max-w-[150px] rounded-[10px] border-transparent bg-muted/60 text-[10px] lg:max-w-[210px]"
          value={userId}
          disabled={pending}
          onValueChange={(id) => {
            start(async () => {
              await switchDemoAccountAction(id);
            });
          }}
          options={demoPeople.map((p) => ({ value: p.id, label: p.name }))}
        />
        <ConfirmationDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[10px]"
              disabled={pending}
            >
              Reset demo
            </Button>
          }
          title="Reset demo data?"
          description="Restore the sample hair salon and nail studio. Saved demo changes will be cleared."
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
