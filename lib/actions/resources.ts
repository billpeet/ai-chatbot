"use server";

import { generateEmbeddings } from "@/lib/ai/embedding";
import { z } from "zod";
import { createEmbeddings, createResource } from "../db/queries";

const insertResourceSchema = z.object({
  content: z
    .string()
    .describe("The content of the resource to add to the knowledge base"),
});

// Type for resources - used to type API request params and within Components
export type NewResourceParams = z.infer<typeof insertResourceSchema>;

export const createResourceAndEmbedding = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await createResource({ content });

    const embeddings = await generateEmbeddings(content);

    await createEmbeddings(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      }))
    );

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
