"use client";

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FamilyLink = {
  id: string;
  adultId: string;
  childId: string;
  relationship: string;
  linkedAt: Timestamp | null;
};

export type InviteCodeDoc = {
  code: string;
  adultId: string;
  relationship: string;
  used: boolean;
  createdAt: Timestamp | null;
};

export const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Guardian",
  "Spouse",
  "Sibling",
  "Child",
  "Other",
] as const;

export type Relationship = (typeof RELATIONSHIP_OPTIONS)[number];

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function isMinorByDob(dateOfBirth: string): boolean {
  return calculateAge(dateOfBirth) < 18;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createInviteCode(
  adultId: string,
  relationship: string
): Promise<string> {
  const code = generateCode();
  await addDoc(collection(db, "inviteCodes"), {
    code,
    adultId,
    relationship,
    used: false,
    createdAt: serverTimestamp(),
  });
  return code;
}

export async function redeemInviteCode(
  code: string,
  childId: string
): Promise<{ success: boolean; error?: string }> {
  const q = query(
    collection(db, "inviteCodes"),
    where("code", "==", code),
    where("used", "==", false)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { success: false, error: "Invalid or already used invite code." };
  }

  const codeDoc = snap.docs[0];
  const data = codeDoc.data() as InviteCodeDoc;

  if (data.adultId === childId) {
    return { success: false, error: "You cannot link to yourself." };
  }

  const existingQ = query(
    collection(db, "familyLinks"),
    where("adultId", "==", data.adultId),
    where("childId", "==", childId)
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    return { success: false, error: "You are already linked to this person." };
  }

  await addDoc(collection(db, "familyLinks"), {
    adultId: data.adultId,
    childId,
    relationship: data.relationship,
    linkedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "inviteCodes", codeDoc.id), { used: true });

  return { success: true };
}

export async function getFamilyLinksForAdult(
  adultId: string
): Promise<FamilyLink[]> {
  const snap = await getDocs(
    query(collection(db, "familyLinks"), where("adultId", "==", adultId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FamilyLink));
}

export async function getFamilyLinksForChild(
  childId: string
): Promise<FamilyLink[]> {
  const snap = await getDocs(
    query(collection(db, "familyLinks"), where("childId", "==", childId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FamilyLink));
}

export async function removeFamilyLink(linkId: string): Promise<void> {
  await deleteDoc(doc(db, "familyLinks", linkId));
}

export async function getUserName(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "Unknown User";
  return (snap.data().name as string) || "Unknown User";
}
