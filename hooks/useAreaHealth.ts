"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { listPublicVerifiedIncidents } from "@/lib/incidents";
import { listPublicVerifiedInfrastructureReports } from "@/lib/infrastructure-reports";
import {
  calculateAreaHealth,
  normalizeAreaHealthReports,
  type AreaHealthSnapshot,
} from "@/lib/area-health";

const EMPTY_SNAPSHOT = calculateAreaHealth([]);

async function loadAreaHealth(): Promise<{
  snapshot: AreaHealthSnapshot;
  error: string | null;
}> {
  const [incidentsResult, infrastructureResult] = await Promise.allSettled([
    listPublicVerifiedIncidents(),
    listPublicVerifiedInfrastructureReports(),
  ]);

  const incidents = incidentsResult.status === "fulfilled" ? incidentsResult.value : [];
  const infrastructureReports =
    infrastructureResult.status === "fulfilled" ? infrastructureResult.value : [];

  let error: string | null = null;
  if (
    incidentsResult.status === "rejected" &&
    infrastructureResult.status === "rejected"
  ) {
    error = "Area Health data could not be loaded.";
  } else if (
    incidentsResult.status === "rejected" ||
    infrastructureResult.status === "rejected"
  ) {
    error = "Some Area Health data is temporarily unavailable.";
  }

  return {
    snapshot: calculateAreaHealth(
      normalizeAreaHealthReports(incidents, infrastructureReports)
    ),
    error,
  };
}

export function useAreaHealth() {
  const [snapshot, setSnapshot] = useState<AreaHealthSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(
    () => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)),
    []
  );

  useEffect(() => {
    // Wait for Firebase to finish restoring auth; signed-out users get the
    // empty snapshot (see the `loading` value returned below).
    if (!userId) return;
    let cancelled = false;
    loadAreaHealth().then((result) => {
      if (cancelled) return;
      setSnapshot(result.snapshot);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const result = await loadAreaHealth();
    setSnapshot(result.snapshot);
    setError(result.error);
    setLoading(false);
  }, [userId]);

  return { snapshot, loading: userId === null ? false : loading, error, refresh };
}
