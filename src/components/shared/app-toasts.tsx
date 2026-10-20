"use client";

import { Toast } from "@base-ui/react/toast";
import { CircleCheck, X } from "lucide-react";
import type { ReactNode } from "react";

export const useToastManager = Toast.useToastManager;

export function AppToasts({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={4000} limit={3}>
      {children}
      <ToastList />
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none print:hidden">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            role="status"
            aria-modal={undefined}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-primary/20 bg-card px-4 py-3 text-card-foreground shadow-lg transition-opacity data-ending-style:opacity-0 data-limited:hidden data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <CircleCheck
              aria-hidden="true"
              className="size-5 shrink-0 text-primary"
            />
            <Toast.Title className="min-w-0 flex-1 text-sm font-medium" />
            <Toast.Close
              aria-label="Dismiss notification"
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
