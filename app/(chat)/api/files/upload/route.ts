import { NextResponse } from "next/server";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import { auth } from "@/app/(auth)/auth";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Accept more file types
    .refine(
      (file) => {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "text/plain",
          "text/markdown",
          "text/csv",
          "application/json",
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message:
          "File type not supported. Supported types: JPEG, PNG, GIF, WebP, PDF, TXT, MD, CSV, JSON",
      }
    ),
});

// Ensure uploads directory exists
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      // Create uploads directory if it doesn't exist
      if (!existsSync(UPLOADS_DIR)) {
        await mkdir(UPLOADS_DIR, { recursive: true });
      }

      // Generate a unique filename to prevent collisions
      const uniqueFilename = `${Date.now()}-${filename}`;
      const filePath = join(UPLOADS_DIR, uniqueFilename);
      await writeFile(filePath, Buffer.from(fileBuffer));

      // Get the origin from the request
      const origin =
        request.headers.get("origin") || request.headers.get("host");
      const protocol = origin?.startsWith("http")
        ? ""
        : process.env.NODE_ENV === "development"
        ? "http://"
        : "https://";

      // Return the absolute public URL for the uploaded file
      const publicUrl = `${protocol}${origin}/uploads/${uniqueFilename}`;
      return NextResponse.json({
        url: publicUrl,
        contentType: file.type,
        name: filename,
      });
    } catch (error) {
      console.error("File upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
