/** Stored in Firestore while a chosen file is still being processed after admin save */
export const PENDING_IMAGE_URL = "__pending__";

export function isImagePending(imageUrl: string | undefined): boolean {
  const u = imageUrl?.trim() ?? "";
  return u === "" || u === PENDING_IMAGE_URL;
}
