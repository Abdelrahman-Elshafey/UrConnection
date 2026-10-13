import sharp from "sharp";

/** Avatars are stored as one 512×512 WebP: small (~20-60 KB), sharp on high-DPI screens. */
export const AVATAR_SIZE = 512;

/**
 * SECURITY: formats we accept, checked on the decoded *contents*, never on the file name
 * or the browser's Content-Type (both are whatever the uploader says). Notably absent:
 * - svg: an SVG is a text document that can contain <script>. sharp *can* read SVG, so an
 *   allow-list is needed; "sharp opened it" alone would let it through.
 * - gif/heif/tiff/raw: not needed for avatars; fewer formats = fewer decoder bugs exposed.
 */
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

/**
 * SECURITY: a "decompression bomb" is a tiny file that claims to be e.g. 100 000 × 100 000
 * pixels; decoding it would need tens of GB of memory. sharp refuses images with more
 * pixels than this (≈ 7000 × 7000), before decoding them.
 */
const MAX_INPUT_PIXELS = 50_000_000;

export class InvalidImageError extends Error {
  constructor() {
    super("not a supported image");
    this.name = "InvalidImageError";
  }
}

/**
 * Uploaded bytes → a fresh 512×512 WebP, or InvalidImageError.
 *
 * Re-encoding is itself a security step: the output contains only pixels we produced,
 * never the uploader's original bytes. Hidden payloads (a script appended to a PNG, a
 * "polyglot" file) don't survive, and neither does metadata: sharp drops EXIF by default,
 * which removes e.g. the GPS position a phone photo carries.
 */
export async function toAvatarWebp(input: Buffer): Promise<Buffer> {
  const options = { limitInputPixels: MAX_INPUT_PIXELS };
  try {
    // metadata() reads only the header: cheap, and enough to know the real format.
    const { format } = await sharp(input, options).metadata();
    if (!format || !ALLOWED_FORMATS.has(format)) throw new InvalidImageError();

    return await sharp(input, options)
      .rotate() // apply the EXIF orientation first (phone photos), since EXIF is dropped
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" }) // fill the square, crop the overflow
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    // Not an image, a corrupt one, a disallowed format, or too many pixels: all the same to the user.
    throw new InvalidImageError();
  }
}
