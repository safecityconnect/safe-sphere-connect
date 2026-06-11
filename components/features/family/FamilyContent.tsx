"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  createInviteCode,
  redeemInviteCode,
  getFamilyLinksForAdult,
  getFamilyLinksForChild,
  removeFamilyLink,
  getUserName,
  RELATIONSHIP_OPTIONS,
  type FamilyLink,
  type Relationship,
} from "@/lib/family";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Users,
  Copy,
  Check,
  Trash2,
  UserPlus,
  AlertTriangle,
  Shield,
  RefreshCw,
  User,
} from "lucide-react";

type LinkedMember = FamilyLink & { memberName: string };

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; uid: string; isMinor: boolean };

export function FamilyContent() {
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [links, setLinks] = useState<LinkedMember[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // Adult: invite code generation
  const [relationship, setRelationship] = useState<Relationship>("Parent");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);

  // Minor: redeem invite code
  const [inviteInput, setInviteInput] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // Remove link
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPageState({ status: "error", message: "Please sign in to continue." });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        setPageState({
          status: "ready",
          uid: user.uid,
          isMinor: data.isMinor === true,
        });
      } catch {
        setPageState({ status: "error", message: "Failed to load profile." });
      }
    });
    return () => unsub();
  }, []);

  const loadLinks = useCallback(async (uid: string, isMinor: boolean) => {
    setLinksLoading(true);
    try {
      const rawLinks = isMinor
        ? await getFamilyLinksForChild(uid)
        : await getFamilyLinksForAdult(uid);

      const withNames = await Promise.all(
        rawLinks.map(async (link) => {
          const targetUid = isMinor ? link.adultId : link.childId;
          const memberName = await getUserName(targetUid);
          return { ...link, memberName };
        })
      );
      setLinks(withNames);
    } catch {
      // silently show empty state on error
    }
    setLinksLoading(false);
  }, []);

  useEffect(() => {
    if (pageState.status === "ready") {
      loadLinks(pageState.uid, pageState.isMinor);
    }
  }, [pageState, loadLinks]);

  const handleGenerateCode = async () => {
    if (pageState.status !== "ready") return;
    setCodeLoading(true);
    setCodeError("");
    setGeneratedCode(null);
    try {
      const code = await createInviteCode(pageState.uid, relationship);
      setGeneratedCode(code);
    } catch {
      setCodeError("Failed to generate code. Please try again.");
    }
    setCodeLoading(false);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    if (pageState.status !== "ready") return;
    const code = inviteInput.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setRedeemError("Please enter a valid 6-digit code.");
      return;
    }
    setRedeemLoading(true);
    setRedeemError("");
    const result = await redeemInviteCode(code, pageState.uid);
    if (result.success) {
      setRedeemSuccess(true);
      setInviteInput("");
      await loadLinks(pageState.uid, pageState.isMinor);
      setTimeout(() => setRedeemSuccess(false), 3000);
    } else {
      setRedeemError(result.error ?? "Something went wrong.");
    }
    setRedeemLoading(false);
  };

  const handleRemoveLink = async (linkId: string) => {
    if (pageState.status !== "ready") return;
    setRemovingId(linkId);
    try {
      await removeFamilyLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch {
      // ignore; link stays in list
    }
    setRemovingId(null);
  };

  if (pageState.status === "loading") {
    return (
      <PageContainer withBottomNav>
        <PageHeader
          title="Family Safety"
          subtitle="Loading…"
          backHref={ROUTES.profile}
        />
        <Skeleton className="mb-4 h-32 rounded-2xl" />
        <Skeleton className="mb-4 h-48 rounded-2xl" />
      </PageContainer>
    );
  }

  if (pageState.status === "error") {
    return (
      <PageContainer withBottomNav>
        <PageHeader title="Family Safety" backHref={ROUTES.profile} />
        <Card padding="md">
          <p className="text-sm text-danger">{pageState.message}</p>
        </Card>
      </PageContainer>
    );
  }

  const { isMinor } = pageState;

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title="Family Safety"
        subtitle={
          isMinor
            ? "Connect with your guardian"
            : "Manage your family connections"
        }
        backHref={ROUTES.profile}
      />

      {/* Minor warning banner */}
      {isMinor && links.length === 0 && !linksLoading && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Guardian not linked
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Some safety features require a linked guardian. Ask your parent or
              guardian to generate an invite code.
            </p>
          </div>
        </div>
      )}

      {/* ── ADULT VIEW ── */}
      {!isMinor && (
        <>
          <section className="mb-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Generate Invite Code
            </h2>
            <Card padding="md">
              <p className="mb-4 text-xs text-muted">
                Share this 6-digit code with a family member. Codes are
                single-use and expire once redeemed.
              </p>

              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) =>
                    setRelationship(e.target.value as Relationship)
                  }
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {generatedCode && (
                <div className="mb-4 rounded-xl border border-primary/30 bg-primary-light px-4 py-4 text-center">
                  <p className="mb-1 text-xs text-muted">Your invite code</p>
                  <p className="text-3xl font-bold tracking-[0.25em] text-primary">
                    {generatedCode}
                  </p>
                  <p className="mt-1 text-xs text-muted">One-time use only</p>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy code
                      </>
                    )}
                  </button>
                </div>
              )}

              {codeError && (
                <p className="mb-3 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
                  {codeError}
                </p>
              )}

              <Button
                fullWidth
                onClick={handleGenerateCode}
                disabled={codeLoading}
              >
                {codeLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {generatedCode ? "Generate New Code" : "Generate Code"}
                  </>
                )}
              </Button>
            </Card>
          </section>

          <section className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Linked Family Members
              </h2>
              <Badge variant="info">{links.length}</Badge>
            </div>

            {linksLoading ? (
              <div className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : links.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No family members linked"
                description="Generate an invite code above and share it with a family member to link accounts."
              />
            ) : (
              <Card padding="none" className="overflow-hidden">
                {links.map((link, i) => (
                  <div
                    key={link.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5",
                      i < links.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {link.memberName}
                      </p>
                      <p className="text-xs text-muted">{link.relationship}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      disabled={removingId === link.id}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-50"
                      aria-label="Remove link"
                    >
                      {removingId === link.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </>
      )}

      {/* ── MINOR VIEW ── */}
      {isMinor && (
        <>
          <section className="mb-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Enter Invite Code
            </h2>
            <Card padding="md">
              <p className="mb-4 text-xs text-muted">
                Ask your parent or guardian to generate an invite code in their
                SafeSphere Connect app, then enter it below.
              </p>

              <div className="flex flex-col gap-3">
                <Input
                  label="6-digit invite code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={inviteInput}
                  onChange={(e) => {
                    setInviteInput(e.target.value.replace(/\D/g, ""));
                    setRedeemError("");
                  }}
                  disabled={redeemLoading}
                  error={redeemError}
                />

                {redeemSuccess && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    Guardian linked successfully!
                  </p>
                )}

                <Button
                  fullWidth
                  onClick={handleRedeem}
                  disabled={redeemLoading || inviteInput.length !== 6}
                >
                  {redeemLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Linking…
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Link Guardian
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </section>

          <section className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Linked Guardian
              </h2>
              <Badge variant={links.length > 0 ? "success" : "warning"}>
                {links.length > 0 ? "Linked" : "None"}
              </Badge>
            </div>

            {linksLoading ? (
              <Skeleton className="h-16 rounded-2xl" />
            ) : links.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No guardian linked"
                description="Enter the invite code from your parent or guardian to connect your accounts."
              />
            ) : (
              <Card padding="none" className="overflow-hidden">
                {links.map((link, i) => (
                  <div
                    key={link.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5",
                      i < links.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {link.memberName}
                      </p>
                      <p className="text-xs text-muted">{link.relationship}</p>
                    </div>
                    <Badge variant="success">Guardian</Badge>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </>
      )}
    </PageContainer>
  );
}
