"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
  
    setLoading(true);
    setError("");
  
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
  
      router.push(ROUTES.dashboard);
    } catch (error) {
      setError("Invalid email or password");
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" href={ROUTES.home} />
        </div>

        <Card padding="lg">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to your SafeSphere Connect account
          </p>

            <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={handleLogin}
            >
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
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {error && (
            <p className="text-sm text-red-500">
            {error}
            </p>
            )}
            <Button
            type="submit"
            fullWidth
            size="lg"
            >
            {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.register}
              className="font-semibold text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
