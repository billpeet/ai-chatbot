import { embed, embedMany, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  createEmbeddings,
  createResource,
  getRelevantResources,
} from "../db/queries";
import { z } from "zod";
import { myProvider } from "./providers";

const embeddingModel = openai.embedding("text-embedding-ada-002");

const generateChunks = (input: string): string[] => {
  const maxChunkSize = 1000;
  const chunks: string[] = [];
  let currentChunk = "";

  // Split into sentences first
  const sentences = input
    .trim()
    .split(".")
    .filter((s) => s.trim());

  for (const sentence of sentences) {
    // If adding this sentence would exceed chunk size and we already have content,
    // start a new chunk
    if (
      currentChunk.length + sentence.length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }

    // If a single sentence is longer than chunk size, force split it
    if (sentence.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      // Split long sentence into maxChunkSize pieces
      for (let i = 0; i < sentence.length; i += maxChunkSize) {
        chunks.push(sentence.slice(i, i + maxChunkSize).trim());
      }
    } else {
      currentChunk += sentence + ".";
    }
  }

  // Add any remaining content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

export const generateEmbeddings = async (value: string) => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return embeddings.map((e, i) => ({
    content: chunks[i],
    embedding: e,
  }));
};

export const generateEmbedding = async (value: string) => {
  const input = value.replaceAll("\\n", " ");

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedding = await generateEmbedding(userQuery);

  const results = await getRelevantResources(userQueryEmbedding, 0.5, 5);

  return results;
};

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

export type NewResourceParams = z.infer<typeof insertResourceSchema>;

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

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
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
