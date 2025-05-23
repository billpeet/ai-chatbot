import { auth } from "@/app/(auth)/auth";
import { createResourceAndEmbedding } from "@/lib/actions/resources";
import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = file.name;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let content: string;
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

    // Handle different file types
    if (contentType === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      content = pdfData.text;
    } else if (
      contentType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      contentType === "application/msword"
    ) {
      // Handle Word documents
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else {
      // Handle text files
      content = buffer.toString("utf-8");
    }

    const result = await createResourceAndEmbedding({
      content,
      name,
      url: fileUrl,
      contentType,
      type: "file",
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
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
