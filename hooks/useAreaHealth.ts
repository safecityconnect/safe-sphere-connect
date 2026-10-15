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

export function useAreaHealth() {
  const [snapshot, setSnapshot] = useState<AreaHealthSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(
    () => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)),
    []
  );

  const refresh = useCallback(async () => {
    // Keep state updates asynchronous when refresh is triggered from an
    // effect; this also lets Firebase finish restoring auth first.
    await Promise.resolve();
    if (!userId) {
      if (userId === null) setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const [incidentsResult, infrastructureResult] = await Promise.allSettled([
      listPublicVerifiedIncidents(),
      listPublicVerifiedInfrastructureReports(),
    ]);

    const incidents = incidentsResult.status === "fulfilled" ? incidentsResult.value : [];
    const infrastructureReports =
      infrastructureResult.status === "fulfilled" ? infrastructureResult.value : [];

    if (
      incidentsResult.status === "rejected" &&
      infrastructureResult.status === "rejected"
    ) {
      setError("Area Health data could not be loaded.");
    } else if (
      incidentsResult.status === "rejected" ||
      infrastructureResult.status === "rejected"
    ) {
      setError("Some Area Health data is temporarily unavailable.");
    }

    setSnapshot(
      calculateAreaHealth(
        normalizeAreaHealthReports(incidents, infrastructureReports)
      )
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { snapshot, loading, error, refresh };
}
