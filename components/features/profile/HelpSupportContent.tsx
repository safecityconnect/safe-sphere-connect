"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FaqItem = { question: string; answer: string };

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I report an incident?",
    answer:
      "Tap 'Report Incident' from the dashboard or the main menu. Fill in the incident title, category, location, and a short description, then tap 'Submit Report'. Your identity is never shared with other citizens.",
  },
  {
    question: "Is my identity shared when I report?",
    answer:
      "No. Your name and contact details are never visible to other citizens. Reports are reviewed by our moderation team before being made public.",
  },
  {
    question: "How does Safe Walk work?",
    answer:
      "Safe Walk lets you share your live route with trusted family members so they can follow your journey in real time. You can start a walk from the Safe Walk section in the dashboard.",
  },
  {
    question: "How do I invite a family member?",
    answer:
      "Go to 'Family Safety' in the Profile settings menu. Generate a unique invite code and share it with your family member. They enter the code during registration or from their Family Safety page.",
  },
  {
    question: "What does Area Health mean?",
    answer:
      "Area Health is an aggregate safety index for your area based on incident frequency, response times, and community feedback. A higher score means a safer environment.",
  },
  {
    question: "How do I change my app language?",
    answer:
      "Open your Profile page and scroll to the Language section. You can switch between English, Hindi, Bengali, Punjabi, and Tamil. The change applies immediately.",
  },
  {
    question: "Why can't I see the Safety Map?",
    answer:
      "The Safety Map requires your device's location permission and an active internet connection. Make sure Location Sharing is enabled in your Quick Preferences and your browser has been granted location access.",
  },
];

type BugCategory = "UI / Display issue" | "Data not loading" | "Login / Auth problem" | "Crash or freeze" | "Other";
const BUG_CATEGORIES: BugCategory[] = [
  "UI / Display issue",
  "Data not loading",
  "Login / Auth problem",
  "Crash or freeze",
  "Other",
];

function Accordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-primary-light/40"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{item.question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{item.answer}</p>
      )}
    </div>
  );
}

type BugForm = { category: BugCategory; description: string };
const initialBugForm: BugForm = { category: "UI / Display issue", description: "" };

export function HelpSupportContent() {
  const [bugForm, setBugForm] = useState<BugForm>(initialBugForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugForm.description.trim()) return;
    setIsSubmitting(true);
    setBugError(null);
    try {
      // Bug reports are written to Firestore for admin review
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const { auth, db } = await import("@/lib/firebase");
      await addDoc(collection(db, "bugReports"), {
        category: bugForm.category,
        description: bugForm.description.trim(),
        userId: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
        status: "open",
      });
      setBugSubmitted(true);
      setBugForm(initialBugForm);
      setTimeout(() => setBugSubmitted(false), 5000);
    } catch (err) {
      setBugError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title="Help & Support"
        subtitle="Find answers and get in touch"
        backHref={ROUTES.profile}
      />

      {/* FAQ */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Frequently Asked Questions</h2>
        <Card padding="none" className="overflow-hidden">
          {FAQ_ITEMS.map((item) => (
            <Accordion key={item.question} item={item} />
          ))}
        </Card>
      </section>

      {/* Contact */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Contact Us</h2>
        <Card padding="md">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email Support</p>
              <a
                href="mailto:support@safecityconnect.in"
                className="text-sm text-primary hover:underline"
              >
                support@safecityconnect.in
              </a>
              <p className="mt-1 text-xs text-muted">
                We typically respond within 24–48 hours on business days.
              </p>
            </div>
          </div>

          <div className={cn("mt-4 flex items-start gap-3 border-t border-border pt-4")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Community Forum</p>
              <p className="mt-0.5 text-xs text-muted">
                Connect with other SafeSphere Connect users, share tips, and get community help via the Community Feed.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Report a Bug */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Report a Bug</h2>
        <Card padding="md">
          <form className="flex flex-col gap-4" onSubmit={handleBugSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Issue Type</label>
              <select
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                value={bugForm.category}
                onChange={(e) =>
                  setBugForm({ ...bugForm, category: e.target.value as BugCategory })
                }
                disabled={isSubmitting}
              >
                {BUG_CATEGORIES.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder="Describe what happened. Include the steps to reproduce the issue if possible."
                value={bugForm.description}
                onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            {bugError && (
              <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
                {bugError}
              </p>
            )}

            {bugSubmitted && (
              <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                Bug report submitted. Thank you for helping us improve!
              </p>
            )}

            <Button type="submit" fullWidth disabled={isSubmitting || !bugForm.description.trim()}>
              {isSubmitting ? "Submitting…" : "Submit Bug Report"}
            </Button>
          </form>
        </Card>
      </section>
    </PageContainer>
  );
}
