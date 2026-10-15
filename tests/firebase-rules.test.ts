import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-safecity-rules-test";
const REPORTER_ID = "reporter-1";

let testEnvironment: RulesTestEnvironment;

function incidentPayload(userId = REPORTER_ID) {
  return {
    title: "Broken streetlight near bus stop",
    description: "The streetlight has been out for two nights.",
    category: "Suspicious Activity",
    location: "Sector 22-C",
    incidentCategory: "Suspicious Activity",
    locationText: "Sector 22-C",
    city: "Chandigarh",
    latitude: 30.7333,
    longitude: 76.7794,
    severity: "medium",
    markerType: "incident",
    safesphereVerified: false,
    verificationStatus: "pending",
    visibility: "pending",
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "open",
  };
}

function infrastructurePayload(userId = REPORTER_ID) {
  return {
    title: "Large pothole",
    description: "A deep pothole is blocking the left lane.",
    category: "Potholes",
    locationText: "Sector 22-C",
    city: "Chandigarh",
    latitude: 30.7333,
    longitude: 76.7794,
    severity: "medium",
    status: "submitted",
    verificationStatus: "pending",
    visibility: "pending",
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve("firestore.rules"), "utf8"),
    },
    storage: {
      rules: readFileSync(resolve("storage.rules"), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.clearStorage();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("authenticated report creation", () => {
  it("allows a signed-in user to submit an incident report", async () => {
    const database = testEnvironment.authenticatedContext(REPORTER_ID).firestore();
    await assertSucceeds(addDoc(collection(database, "incidents"), incidentPayload()));
  });

  it("allows a signed-in user to submit an infrastructure report", async () => {
    const database = testEnvironment.authenticatedContext(REPORTER_ID).firestore();
    await assertSucceeds(
      addDoc(collection(database, "infrastructureReports"), infrastructurePayload())
    );
  });

  it("allows a signed-in user to upload their own incident image", async () => {
    const storage = testEnvironment.authenticatedContext(REPORTER_ID).storage();
    const image = new Blob(["test image"], { type: "image/jpeg" });
    await assertSucceeds(
      uploadBytes(ref(storage, `incidents/${REPORTER_ID}/evidence.jpg`), image, {
        contentType: "image/jpeg",
      })
    );
  });
});

describe("least-privilege report creation", () => {
  it("denies unauthenticated report creation", async () => {
    const database = testEnvironment.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(database, "incidents"), incidentPayload()));
    await assertFails(
      addDoc(collection(database, "infrastructureReports"), infrastructurePayload())
    );
  });

  it("denies creating a report for another user", async () => {
    const database = testEnvironment.authenticatedContext(REPORTER_ID).firestore();
    await assertFails(
      addDoc(collection(database, "incidents"), incidentPayload("different-user"))
    );
    await assertFails(
      addDoc(
        collection(database, "infrastructureReports"),
        infrastructurePayload("different-user")
      )
    );
  });

  it("denies self-publishing unreviewed reports", async () => {
    const database = testEnvironment.authenticatedContext(REPORTER_ID).firestore();
    await assertFails(
      addDoc(collection(database, "incidents"), {
        ...incidentPayload(),
        safesphereVerified: true,
        verificationStatus: "verified",
        visibility: "public",
      })
    );
    await assertFails(
      addDoc(collection(database, "infrastructureReports"), {
        ...infrastructurePayload(),
        verificationStatus: "verified",
        visibility: "public",
      })
    );
  });

  it("denies granting an admin role through profile creation", async () => {
    const database = testEnvironment.authenticatedContext(REPORTER_ID).firestore();
    await assertFails(
      setDoc(doc(database, "users", REPORTER_ID), {
        name: "Reporter",
        role: "admin",
      })
    );
  });

  it("denies uploads outside the reporter's image path", async () => {
    const storage = testEnvironment.authenticatedContext(REPORTER_ID).storage();
    const image = new Blob(["test image"], { type: "image/jpeg" });
    await assertFails(
      uploadBytes(ref(storage, "incidents/different-user/evidence.jpg"), image, {
        contentType: "image/jpeg",
      })
    );
  });
});
