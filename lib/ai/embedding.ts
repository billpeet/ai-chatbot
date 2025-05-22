import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { getRelevantResources } from "../db/queries";

const embeddingModel = openai.embedding("text-embedding-ada-002");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
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
