import fs from "fs";
import path from "path";
import crypto from "crypto";

// Magic byte signatures for common image formats
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (need to check WEBP at offset 8)
  "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  "image/avif": [[0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]], // ftypavif
  "image/svg+xml": [[0x3c, 0x3f, 0x78, 0x6d, 0x6c], [0x3c, 0x73, 0x76, 0x67]], // <?xml or <svg
};

function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const signatures = IMAGE_SIGNATURES[declaredMimeType];
  if (!signatures) return false;

  for (const sig of signatures) {
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }

  // Special case for WebP: check "WEBP" at offset 8
  if (declaredMimeType === "image/webp" && buffer.length >= 12) {
    const riff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const webp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (riff && webp) return true;
  }

  return false;
}

export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), "client", "public", "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      } catch (err) {
        console.warn("[Storage] Could not create uploads directory:", err);
      }
    }
  }

  async saveBase64Image(base64Data: string, originalName?: string): Promise<UploadResult> {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image data payload");
    }

    const mimeType = matches[1].toLowerCase();
    const isImage = mimeType.startsWith("image/");
    if (!isImage) {
      throw new Error("Only valid image files are permitted");
    }

    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length > 20 * 1024 * 1024) {
      throw new Error("File exceeds maximum allowable size of 20MB");
    }

    // Validate magic bytes match declared MIME type
    if (!validateMagicBytes(buffer, mimeType)) {
      throw new Error("File content does not match declared image type (magic byte validation failed)");
    }

    let ext = "jpg";
    if (mimeType.includes("png")) ext = "png";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("gif")) ext = "gif";
    else if (mimeType.includes("avif")) ext = "avif";
    else if (mimeType.includes("svg")) ext = "svg";

    const randomName = `img_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filePath = path.join(this.uploadDir, randomName);

    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `/uploads/${randomName}`,
      filename: randomName,
      sizeBytes: buffer.length,
    };
  }
}

export const storageService = new StorageService();
