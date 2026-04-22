import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { mediaLibrary, orderPhotos } from "../shared/schema";
import { objectStorage, objectStorageProviderName } from "../server/storage/provider";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const uploadRoot = path.resolve(process.cwd(), "uploads");

const extractLocalUploadPath = (fileKey: string) => {
  if (fileKey.startsWith("/uploads/")) {
    return fileKey.slice("/uploads/".length);
  }

  if (!ABSOLUTE_URL_PATTERN.test(fileKey)) {
    return null;
  }

  const pathname = new URL(fileKey).pathname;
  return pathname.startsWith("/uploads/") ? pathname.slice("/uploads/".length) : null;
};

const inferMimeType = (fileKey: string) => {
  const lower = fileKey.toLowerCase();

  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";

  return "application/octet-stream";
};

const resolveAbsoluteLocalPath = (relativePath: string) => {
  const absolutePath = path.resolve(uploadRoot, relativePath);
  if (!absolutePath.startsWith(uploadRoot)) {
    throw new Error(`Refusing to access a file outside uploads: ${relativePath}`);
  }

  return absolutePath;
};

async function migrateMediaLibrary() {
  const mediaRows = await db
    .select({
      id: mediaLibrary.id,
      fileKey: mediaLibrary.fileKey,
      mimeType: mediaLibrary.mimeType,
      title: mediaLibrary.title,
    })
    .from(mediaLibrary);

  let migrated = 0;

  for (const row of mediaRows) {
    const relativePath = extractLocalUploadPath(row.fileKey);
    if (!relativePath) {
      continue;
    }

    const absolutePath = resolveAbsoluteLocalPath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`[media] Skipping missing file for "${row.title}": ${absolutePath}`);
      continue;
    }

    const buffer = await fs.promises.readFile(absolutePath);
    const newFileKey = await objectStorage.put(buffer, row.mimeType || inferMimeType(row.fileKey), "media");

    await db.update(mediaLibrary).set({ fileKey: newFileKey }).where(eq(mediaLibrary.id, row.id));
    migrated += 1;
    console.log(`[media] Migrated "${row.title}" -> ${newFileKey}`);
  }

  return migrated;
}

async function migrateOrderPhotos() {
  const photoRows = await db
    .select({
      id: orderPhotos.id,
      fileKey: orderPhotos.fileKey,
      orderId: orderPhotos.orderId,
    })
    .from(orderPhotos);

  let migrated = 0;

  for (const row of photoRows) {
    const relativePath = extractLocalUploadPath(row.fileKey);
    if (!relativePath) {
      continue;
    }

    const absolutePath = resolveAbsoluteLocalPath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`[order-photo] Skipping missing file for order ${row.orderId}: ${absolutePath}`);
      continue;
    }

    const buffer = await fs.promises.readFile(absolutePath);
    const newFileKey = await objectStorage.put(buffer, inferMimeType(row.fileKey), "orders");

    await db.update(orderPhotos).set({ fileKey: newFileKey }).where(eq(orderPhotos.id, row.id));
    migrated += 1;
    console.log(`[order-photo] Migrated order ${row.orderId} -> ${newFileKey}`);
  }

  return migrated;
}

async function main() {
  if (objectStorageProviderName === "local") {
    throw new Error("Configure OBJECT_STORAGE_PROVIDER=supabase before running this migration.");
  }

  console.log(`Using "${objectStorageProviderName}" storage provider`);

  const [mediaCount, photoCount] = await Promise.all([
    migrateMediaLibrary(),
    migrateOrderPhotos(),
  ]);

  console.log(`Migration complete: ${mediaCount} media items and ${photoCount} order photos moved off local uploads.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit();
  });
