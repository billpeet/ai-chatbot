"use server";

import { generateEmbeddings } from "@/lib/ai/embedding";
import { z } from "zod";
import {
  createEmbeddings,
  createResource,
  deleteResource,
  getResourceById,
} from "../db/queries";
import { generateText } from "ai";
import { myProvider } from "../ai/providers";
import { auth } from "@/app/(auth)/auth";
import path from "path";
import { existsSync } from "fs";
import { unlinkSync } from "fs";

const insertResourceSchema = z.object({
  content: z
    .string()
    .describe("The content of the resource to add to the knowledge base"),
  name: z.string().describe("The name of the resource"),
  url: z.string().describe("The url of the resource").optional(),
  type: z.string().describe("The type of the resource"),
  contentType: z.string().describe("The content type of the resource"),
  createdBy: z.string().describe("The user who created the resource"),
  updatedBy: z.string().describe("The user who updated the resource"),
});

// Type for resources - used to type API request params and within Components
export type NewResourceParams = z.infer<typeof insertResourceSchema>;

const addDocumentAsResourceSchema = z.object({
  document: z.instanceof(File),
});

export const addDocumentAsResource = async (input: NewResourceParams) => {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { document } = addDocumentAsResourceSchema.parse(input);

  const content = await document.text();
  const name = document.name;
  const contentType = document.type;
  const createdBy = session.user.id;
  const updatedBy = session.user.id;

  return await createResourceAndEmbedding({
    content,
    name,
    contentType,
    type: "file",
    createdBy,
    updatedBy,
  });
};

export const createResourceAndEmbedding = async (input: NewResourceParams) => {
  try {
    const { content, name, url, contentType, type, createdBy, updatedBy } =
      insertResourceSchema.parse(input);

    const contentSummary = await generateContentSummary(content);

    const [resource] = await createResource({
      content,
      contentSummary,
      name,
      contentType,
      url,
      type,
      size: content.length,
      createdBy,
      updatedBy,
    });

    const embeddings = await generateEmbeddings(content);

    await createEmbeddings(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      }))
    );

    return { success: true, resource };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message.length > 0
          ? error.message
          : "Error, please try again.",
    };
  }
};

async function generateContentSummary(content: string) {
  const { text: contentSummary } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: `\n
    - you will generate a short summary of the content
    - ensure it is not more than 100 characters long
    - do not use quotes or colons`,
    prompt: content,
  });

  return contentSummary;
}

export const deleteResourceAndFiles = async (id: string) => {
  const resource = await getResourceById(id);

  if (!resource) {
    throw new Error("Resource not found");
  }

  await deleteResource(id);

  if (resource.type === "file" && resource.url) {
    const filePath = path.join(
      process.cwd(),
      "public",
      resource.url?.replace("uploads", "") ?? ""
    );
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  return { success: true };
};
