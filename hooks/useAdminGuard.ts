"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

type AdminGuardState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useAdminGuard(): AdminGuardState {
  const router = useRouter();
  const [state, setState] = useState<AdminGuardState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const role = snap.exists() ? snap.data()?.role : undefined;
        if (role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setState({ user: currentUser, isAdmin: true, loading: false });
      } catch {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return state;
}
