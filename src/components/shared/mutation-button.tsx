"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "./confirmation-dialog";
import { FormMessage } from "./form-message";
import type { ActionResult } from "@/lib/actions/result";
import { useToastManager } from "./app-toasts";
export function MutationButton({
  label,
  description,
  action,
  input,
  className,
}: {
  label: string;
  description: string;
  action: (input: unknown) => Promise<ActionResult<unknown>>;
  input: unknown;
  className?: string;
}) {
  const router = useRouter();
  const toasts = useToastManager();
  const [message, setMessage] = useState<{
    status: "success" | "error";
    text: string;
  }>();
  return (
    <div className="space-y-2">
      <ConfirmationDialog
        trigger={
          <Button variant="outline" size="sm" className={className}>
            {label}
          </Button>
        }
        title={`${label}?`}
        description={description}
        confirmLabel={label}
        onConfirm={async () => {
          setMessage(undefined);
          const result = await action(input);
          if (result.status === "success") {
            toasts.add({ title: result.message });
            router.refresh();
          } else {
            setMessage({ status: "error", text: result.message });
          }
          return result.status === "success";
        }}
      />
      {message && (
        <FormMessage status={message.status}>{message.text}</FormMessage>
      )}
    </div>
  );
}
