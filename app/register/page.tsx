"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isMinorByDob } from "@/lib/family";
import React from "react";
import { Users, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFamilyPrompt, setShowFamilyPrompt] = useState(false);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 5);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      const minor = isMinorByDob(dateOfBirth);

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        dateOfBirth,
        isMinor: minor,
        phone: "",
        city: "",
        neighborhood: "",
        memberSince: new Date().toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
        createdAt: serverTimestamp(),
        stats: {
          reportsFiled: 0,
          safeWalks: 0,
          incidentsReported: 0,
          communityPoints: 0,
        },
      });

      if (minor) {
        router.push(ROUTES.dashboard);
      } else {
        setShowFamilyPrompt(true);
      }
    } catch {
      setError("Failed to create account. Please try again.");
    }

    setLoading(false);
  };

  if (showFamilyPrompt) {
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
                  Link Family Members
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Connect with family to enable shared safety features, arrival
                  alerts, and SOS escalation.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full pt-2">
                <Button fullWidth onClick={() => router.push(ROUTES.family)}>
                  <Users className="h-4 w-4" />
                  Invite Family Member
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => router.push(ROUTES.dashboard)}
                >
                  Later
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" href={ROUTES.home} />
        </div>

        <Card padding="lg">
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="mt-1 text-sm text-muted">
            Join your community safety network
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleRegister}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              max={maxDateStr}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href={ROUTES.login}
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
