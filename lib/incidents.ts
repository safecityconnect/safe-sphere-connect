import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Incident, VerificationStatus } from "@/lib/types/incident";

export async function listIncidentsByVerificationStatus(
  status: VerificationStatus
): Promise<Incident[]> {
  const q = query(
    collection(db, "incidents"),
    where("verificationStatus", "==", status),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Incident, "id">) }));
}

export async function approveIncident(
  incidentId: string,
  adminUid: string,
  reviewNotes?: string
): Promise<void> {
  await updateDoc(doc(db, "incidents", incidentId), {
    verificationStatus: "verified",
    visibility: "public",
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(reviewNotes ? { reviewNotes } : {}),
  });
}

export async function rejectIncident(
  incidentId: string,
  adminUid: string,
  reviewNotes?: string
): Promise<void> {
  await updateDoc(doc(db, "incidents", incidentId), {
    verificationStatus: "rejected",
    visibility: "hidden",
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(reviewNotes ? { reviewNotes } : {}),
  });
}
