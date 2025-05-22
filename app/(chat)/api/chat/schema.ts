import { chatModels } from "@/lib/ai/models";
import { z } from "zod";

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(["text"]),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(["user"]),
    content: z.string().min(1).max(2000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string(), //.url(),
          name: z.string().min(1).max(2000),
          contentType: z.enum([
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "text/plain",
            "text/markdown",
            "text/csv",
            "application/json",
          ]),
        })
      )
      .optional(),
  }),
  selectedChatModel: z.enum(
    chatModels.map((model) => model.id) as [string, ...string[]]
  ),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
