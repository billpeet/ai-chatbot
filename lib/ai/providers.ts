import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { xai } from "@ai-sdk/xai";
import { openai } from "@ai-sdk/openai";
import { isTestEnvironment } from "../constants";
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from "./models.test";

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        "chat-model": openai("gpt-4o"),
        "chat-model-reasoning": wrapLanguageModel({
          model: openai("gpt-o1"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": openai("gpt-4o-mini"),
        "artifact-model": openai("gpt-4o"),
        // "peter-the-punkin-eater": openai("gpt-4o"),
      },
      // imageModels: {
      //   "small-model": openai("gpt-4o"),
      // },
    });
