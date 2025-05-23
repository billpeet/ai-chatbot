import { auth } from "@/app/(auth)/auth";
import { createResourceAndEmbedding } from "@/lib/actions/resources";
import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let content: string;
    const name = file.name;
    const contentType = file.type;
    const createdBy = session.user.dbId ?? session.user.id;
    const updatedBy = session.user.dbId ?? session.user.id;

    // Ensure uploads directory exists
    const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = join(UPLOADS_DIR, name);
    await writeFile(filePath, buffer);

    // Create the public URL for the file
    const fileUrl = `/uploads/${name}`;

    // Handle PDF files
    if (contentType === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      content = pdfData.text;
    } else {
      // Handle text files
      content = buffer.toString("utf-8");
    }

    const result = await createResourceAndEmbedding({
      content,
      name,
      contentType,
      type: "file",
      url: fileUrl,
      createdBy,
      updatedBy,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      resource: result.resource,
      fileUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
