"use client";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { Shield, Users } from "lucide-react";

type GuardianLinkPromptProps = {
  onLinkNow: () => void;
  onDismiss: () => void;
};

export function GuardianLinkPrompt({ onLinkNow, onDismiss }: GuardianLinkPromptProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" href={ROUTES.home} />
        </div>

        <Card padding="lg">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
              <Shield className="h-7 w-7 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                Link a Guardian
              </h2>
              <p className="mt-2 text-sm text-muted">
                Link a parent/guardian account to unlock family safety features
                and emergency coordination.
              </p>
              <p className="mt-3 text-xs text-muted">
                This is optional — you can complete it later from the{" "}
                <span className="font-medium text-foreground">Family Linking</span>{" "}
                page in your profile.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Button fullWidth onClick={onLinkNow}>
                <Users className="h-4 w-4" />
                Link Guardian Now
              </Button>
              <Button variant="ghost" fullWidth onClick={onDismiss}>
                Do This Later
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
