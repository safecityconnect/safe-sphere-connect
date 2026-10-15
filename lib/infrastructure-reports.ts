import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  InfrastructureReport,
  InfrastructureVerificationStatus,
} from "@/lib/types/infrastructure-report";
import { infrastructureSeverityForCategory } from "@/lib/types/infrastructure-report";

const COLLECTION = "infrastructureReports";

function toInfrastructureReport(
  document: import("firebase/firestore").QueryDocumentSnapshot
): InfrastructureReport {
  return {
    id: document.id,
    ...(document.data() as Omit<InfrastructureReport, "id">),
  };
}

function newestFirst(a: InfrastructureReport, b: InfrastructureReport): number {
  return (
    (b.createdAt?.toDate().getTime() ?? 0) -
    (a.createdAt?.toDate().getTime() ?? 0)
  );
}

export async function listPublicVerifiedInfrastructureReports(): Promise<
  InfrastructureReport[]
> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where("verificationStatus", "==", "verified"),
      where("visibility", "==", "public")
    )
  );
  return snapshot.docs.map(toInfrastructureReport).sort(newestFirst);
}

export async function listInfrastructureReportsForUser(
  userId: string
): Promise<InfrastructureReport[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );
  return snapshot.docs.map(toInfrastructureReport).sort(newestFirst);
}

export async function listInfrastructureReportsByVerificationStatus(
  status: InfrastructureVerificationStatus
): Promise<InfrastructureReport[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("verificationStatus", "==", status))
  );
  return snapshot.docs.map(toInfrastructureReport).sort(newestFirst);
}

export async function approveInfrastructureReport(
  reportId: string,
  adminUid: string,
  reviewNotes?: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, reportId), {
    verificationStatus: "verified",
    visibility: "public",
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(reviewNotes ? { reviewNotes } : {}),
  });
}

export async function rejectInfrastructureReport(
  reportId: string,
  adminUid: string,
  reviewNotes?: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, reportId), {
    verificationStatus: "rejected",
    visibility: "hidden",
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(reviewNotes ? { reviewNotes } : {}),
  });
}

export type CreateInfrastructureReportInput = {
  title: string;
  description: string;
  category: string;
  locationText: string;
  city: string;
  userId: string;
  latitude?: number;
  longitude?: number;
};

export async function createInfrastructureReport(
  input: CreateInfrastructureReportInput
): Promise<string> {
  const { latitude, longitude, ...fields } = input;
  const hasCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const reference = await addDoc(collection(db, COLLECTION), {
    ...fields,
    ...(hasCoordinates ? { latitude, longitude } : {}),
    severity: infrastructureSeverityForCategory(input.category),
    status: "submitted",
    verificationStatus: "pending",
    visibility: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}
