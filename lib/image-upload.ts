import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export const MAX_INCIDENT_IMAGES = 3;
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB original upload cap
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Images at or below this size are uploaded as-is to avoid unnecessary re-encoding. */
const COMPRESSION_SKIP_THRESHOLD_BYTES = 500 * 1024; // 500KB
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.75;

function extensionForMimeType(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

/**
 * Compresses an image file when it's large or has oversized dimensions.
 * Small images are returned unchanged to avoid needless quality loss.
 */
export async function compressImageIfNeeded(file: File): Promise<Blob> {
  if (file.size <= COMPRESSION_SKIP_THRESHOLD_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION_PX / bitmap.width,
      MAX_DIMENSION_PX / bitmap.height
    );
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
    );

    if (!blob) return file;
    // Only use the compressed version if it's actually smaller.
    return blob.size < file.size ? blob : file;
  } catch {
    // If compression fails for any reason, fall back to the original file
    // rather than blocking the report submission.
    return file;
  }
}

/**
 * Uploads incident photos to Firebase Storage under
 * `incidents/{userId}/{timestamp}-{index}.{ext}` and returns their download URLs.
 */
export async function uploadIncidentImages(
  files: File[],
  userId: string,
  onProgress?: (index: number, fraction: number) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const blob = await compressImageIfNeeded(file);
    const contentType = blob.type || file.type || "image/jpeg";
    const ext = extensionForMimeType(contentType);
    const path = `incidents/${userId}/${Date.now()}-${i}.${ext}`;
    const storageRef = ref(storage, path);

    const url = await new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob, { contentType });
      task.on(
        "state_changed",
        (snapshot) => {
          onProgress?.(i, snapshot.bytesTransferred / snapshot.totalBytes);
        },
        (err) => reject(err),
        async () => {
          try {
            resolve(await getDownloadURL(task.snapshot.ref));
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    urls.push(url);
  }

  return urls;
}
