import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AVATAR_SIZE, InvalidImageError, toAvatarWebp } from "./avatarImage";

/** Real sharp, real images made on the fly: what the API accepts and refuses. */
const image = (format: "png" | "jpeg" | "webp" | "gif", width = 800, height = 600) =>
  sharp({ create: { width, height, channels: 3, background: { r: 0, g: 113, b: 227 } } })
    .toFormat(format)
    .toBuffer();

describe("toAvatarWebp", () => {
  it.each(["png", "jpeg", "webp"] as const)("turns a %s into a 512×512 WebP", async (format) => {
    const out = await toAvatarWebp(await image(format));
    const meta = await sharp(out).metadata();
    expect(meta).toMatchObject({ format: "webp", width: AVATAR_SIZE, height: AVATAR_SIZE });
  });

  it("drops metadata such as the camera's EXIF data (GPS position etc.)", async () => {
    const withExif = await sharp(await image("jpeg"))
      .withExif({ IFD0: { Copyright: "secret-location" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined(); // the input really has EXIF
    expect((await sharp(await toAvatarWebp(withExif)).metadata()).exif).toBeUndefined();
  });

  it("refuses an SVG, even though sharp could read it (it may contain script)", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>');
    await expect(toAvatarWebp(svg)).rejects.toBeInstanceOf(InvalidImageError);
  });

  it("refuses an HTML page, whatever its name says", async () => {
    await expect(toAvatarWebp(Buffer.from("<!doctype html><script>alert(1)</script>"))).rejects.toBeInstanceOf(InvalidImageError);
  });

  it("refuses formats we don't offer (GIF)", async () => {
    await expect(toAvatarWebp(await image("gif"))).rejects.toBeInstanceOf(InvalidImageError);
  });

  it("refuses a truncated (corrupt) image", async () => {
    const png = await image("png");
    await expect(toAvatarWebp(png.subarray(0, 100))).rejects.toBeInstanceOf(InvalidImageError);
  });
});
