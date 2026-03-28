"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function RunSubmitButton({
  idleLabel,
  pendingLabel,
  variant = "default"
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "default" | "secondary" | "ghost" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className="w-full" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
