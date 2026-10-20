"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordForm } from "@/components/shared/record-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FormMessage } from "@/components/shared/form-message";
import { salonSchema } from "../schemas";
import { createSalonAction, selectSalonAction } from "../actions";
export function SalonPicker({
  salons,
}: {
  salons: { id: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your salons</CardTitle>
          <CardDescription>
            Choose the business you want to work in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <FormMessage status="error">{error}</FormMessage>}
          {salons.map((s) => (
            <Button
              className="h-auto w-full justify-between py-4"
              variant="outline"
              disabled={pending}
              key={s.id}
              onClick={() =>
                start(async () => {
                  const result = await selectSalonAction(s.id);
                  if (result.status === "error") setError(result.message);
                  else {
                    router.push("/dashboard");
                    router.refresh();
                  }
                })
              }
            >
              {s.name}
              <span className="text-xs text-muted-foreground capitalize">
                {s.role}
              </span>
            </Button>
          ))}
          {!salons.length && (
            <p className="text-sm text-muted-foreground">
              Create your first salon, or ask its owner to add your account.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Create a salon</CardTitle>
          <CardDescription>
            Start with your business identity. You can configure any service
            catalog after setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordForm
            schema={salonSchema}
            defaults={{ name: "", slug: "" }}
            fields={[
              { name: "name", label: "Salon name" },
              {
                name: "slug",
                label: "Unique workspace address",
                hint: "Lowercase letters, numbers and hyphens, e.g. my-studio.",
              },
            ]}
            action={createSalonAction}
            submitLabel="Create salon"
            onSuccess={() => {
              router.push("/settings/salon");
              router.refresh();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
