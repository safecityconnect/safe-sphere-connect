"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type State = { isAdmin: boolean; loading: boolean };

/**
 * Returns whether the currently signed-in user has the "admin" role.
 * Unlike useAdminGuard, this hook never redirects — it is safe to call
 * from any page and simply exposes the role for conditional rendering.
 */
export function useIsAdmin(): State {
  const [state, setState] = useState<State>({ isAdmin: false, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ isAdmin: false, loading: false });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data()?.role : undefined;
        setState({ isAdmin: role === "admin", loading: false });
      } catch {
        setState({ isAdmin: false, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
}
