import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const LOCAL_UPLOAD_PREFIX = "/uploads/";
const DEFAULT_SUPABASE_BUCKET = "media";

export interface ObjectStorageProvider {
  put(buffer: Buffer, mimeType: string, folder: string): Promise<string>;
  getUrl(fileKey: string): string;
  delete(fileKey: string): Promise<void>;
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const sanitizeFolder = (folder: string) =>
  folder
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-") || "general";

const encodeObjectKey = (objectKey: string) =>
  objectKey
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const extensionForMimeType = (mimeType: string) => {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    default:
      return ".bin";
  }
};

const buildObjectKey = (folder: string, mimeType: string) => {
  const safeFolder = sanitizeFolder(folder);
  return `${safeFolder}/${Date.now()}-${randomUUID()}${extensionForMimeType(mimeType)}`;
};

const stripUploadsPrefix = (pathname: string) =>
  pathname.startsWith(LOCAL_UPLOAD_PREFIX) ? pathname.slice(LOCAL_UPLOAD_PREFIX.length) : null;

const extractLocalUploadPath = (fileKey: string) => {
  if (fileKey.startsWith(LOCAL_UPLOAD_PREFIX)) {
    return stripUploadsPrefix(fileKey);
  }

  if (!ABSOLUTE_URL_PATTERN.test(fileKey)) {
    return null;
  }

  const pathname = new URL(fileKey).pathname;
  return stripUploadsPrefix(pathname);
};

const isNotFoundError = (error: unknown) =>
  Boolean(error && typeof error === "object" && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT");

class LocalObjectStorageProvider implements ObjectStorageProvider {
  private readonly uploadRoot = path.resolve(process.cwd(), "uploads");

  async put(buffer: Buffer, mimeType: string, folder: string) {
    const objectKey = buildObjectKey(folder, mimeType);
    const targetPath = path.resolve(this.uploadRoot, objectKey);

    if (!targetPath.startsWith(this.uploadRoot)) {
      throw new Error("Invalid local upload path");
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, buffer);

    return `${LOCAL_UPLOAD_PREFIX}${objectKey.replace(/\\/g, "/")}`;
  }

  getUrl(fileKey: string) {
    return fileKey;
  }

  async delete(fileKey: string) {
    const relativePath = extractLocalUploadPath(fileKey);
    if (!relativePath) {
      return;
    }

    const targetPath = path.resolve(this.uploadRoot, relativePath);
    if (!targetPath.startsWith(this.uploadRoot)) {
      throw new Error("Refusing to delete a file outside uploads");
    }

    try {
      await fs.promises.unlink(targetPath);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }
}

class SupabaseObjectStorageProvider implements ObjectStorageProvider {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;

  constructor() {
    const baseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_SUPABASE_BUCKET;

    if (!baseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set when OBJECT_STORAGE_PROVIDER=supabase");
    }

    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.serviceRoleKey = serviceRoleKey;
    this.bucket = bucket;
  }

  async put(buffer: Buffer, mimeType: string, folder: string) {
    const objectKey = buildObjectKey(folder, mimeType);
    const response = await fetch(
      `${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodeObjectKey(objectKey)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.serviceRoleKey}`,
          apikey: this.serviceRoleKey,
          "content-type": mimeType,
          "cache-control": "3600",
          "x-upsert": "false",
        },
        body: buffer,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    return objectKey;
  }

  getUrl(fileKey: string) {
    if (ABSOLUTE_URL_PATTERN.test(fileKey) || fileKey.startsWith("/")) {
      return fileKey;
    }

    return `${this.baseUrl}/storage/v1/object/public/${encodeURIComponent(this.bucket)}/${encodeObjectKey(fileKey)}`;
  }

  async delete(fileKey: string) {
    const objectKey = this.extractObjectKey(fileKey);
    if (!objectKey) {
      return;
    }

    const response = await fetch(`${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prefixes: [objectKey] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase delete failed (${response.status}): ${errorText || response.statusText}`);
    }
  }

  private extractObjectKey(fileKey: string) {
    if (!fileKey) {
      return null;
    }

    if (!ABSOLUTE_URL_PATTERN.test(fileKey)) {
      return fileKey.startsWith("/") ? null : fileKey;
    }

    const url = new URL(fileKey);
    const publicPrefix = `/storage/v1/object/public/${this.bucket}/`;
    const privatePrefix = `/storage/v1/object/${this.bucket}/`;

    if (url.pathname.startsWith(publicPrefix)) {
      return decodeURIComponent(url.pathname.slice(publicPrefix.length));
    }

    if (url.pathname.startsWith(privatePrefix)) {
      return decodeURIComponent(url.pathname.slice(privatePrefix.length));
    }

    return null;
  }
}

const providerName = (process.env.OBJECT_STORAGE_PROVIDER || "local").trim().toLowerCase();

export const objectStorageProviderName = providerName;

export const objectStorage: ObjectStorageProvider =
  providerName === "supabase" ? new SupabaseObjectStorageProvider() : new LocalObjectStorageProvider();
