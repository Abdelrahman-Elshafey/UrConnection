import { DeleteObjectCommand, PutBucketWebsiteCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * File storage (Stage 10): an S3 bucket, here Garage in Docker.
 *
 * Object storage in one paragraph: a bucket is a flat map from a *key* (a name like
 * "avatars/<uid>/<id>.webp"; the "/" is just part of the name, there are no real folders)
 * to bytes plus a few headers (Content-Type, Cache-Control). You PUT, GET and DELETE whole
 * objects by key over HTTP. No partial edits, no queries: that's what makes it simple and cheap.
 *
 * Two doors into the same bucket:
 *   - the S3 API (port 3900): signed requests with the access key. Only the API uses it, to write.
 *   - the website endpoint (port 3902): read-only, no credentials. Browsers use it to load
 *     images, through /media/* on our own origin (Vite proxy in dev, Caddy in prod).
 *
 * Code elsewhere only sees this small interface, so tests use an in-memory fake, and a
 * different backend (plain files, AWS S3, R2) would mean writing one new implementation.
 */
export interface Storage {
  put(key: string, body: Buffer, options: { contentType: string; cacheControl: string }): Promise<void>;
  /** Deleting a key that doesn't exist is not an error (S3 behaves the same). */
  delete(key: string): Promise<void>;
}

/** Where browsers read stored objects: on our own origin, so no CORS and no extra domain. */
export const MEDIA_PATH = "/media";

/** The URL a browser uses for a stored object, e.g. "/media/avatars/<uid>/<id>.webp". */
export const mediaUrl = (key: string): string => `${MEDIA_PATH}/${key}`;

export interface S3StorageOptions {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function createS3Storage(options: S3StorageOptions): Storage & { enableWebsiteAccess(): Promise<void> } {
  const s3 = new S3Client({
    endpoint: options.endpoint,
    region: options.region,
    credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    // "Path style": http://host:3900/<bucket>/<key> instead of http://<bucket>.host/<key>.
    // Virtual-host style needs DNS for every bucket name, which localhost doesn't have.
    forcePathStyle: true,
  });
  const Bucket = options.bucket;

  return {
    async put(key, body, { contentType, cacheControl }) {
      // Content-Type and Cache-Control are stored with the object and sent back to
      // every browser that reads it.
      await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
    },

    async delete(key) {
      await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
    },

    /**
     * Lets browsers read this bucket's objects through the website endpoint (read-only,
     * no credentials). Safe to call on every start: setting the same config twice is a no-op.
     * SECURITY: everything in this bucket becomes readable by anyone who knows its key.
     * Fine for avatars (they're shown publicly anyway); private files would need a second
     * bucket without website access, served through signed URLs.
     */
    async enableWebsiteAccess() {
      await s3.send(new PutBucketWebsiteCommand({ Bucket, WebsiteConfiguration: { IndexDocument: { Suffix: "index.html" } } }));
    },
  };
}
