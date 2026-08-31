import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { eventHandler, readBody, createError } from "h3";
import { useRuntimeConfig } from "#imports";
import {
  buildAIContext,
  calculateMaxTokens,
  getSystem
} from "../../utils/ai/generate.js";
import { requireStudioAuth } from "../../utils/auth.js";
export default eventHandler(async (event) => {
  await requireStudioAuth(event);
  const config = useRuntimeConfig(event);
  const aiConfig = config.studio?.ai;
  const apiKey = aiConfig?.apiKey;
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "AI features are not enabled. Please set NUXT_STUDIO_AI_API_KEY environment variable."
    });
  }
  const gateway = createGateway({ apiKey });
  const { prompt, previousContext, nextContext, mode, language, selectionLength, fsPath, collectionName, hintOptions } = await readBody(event);
  if (mode === "continue") {
    if (!previousContext) {
      throw createError({
        statusCode: 400,
        statusMessage: "previousContext is required for continue mode"
      });
    }
  } else {
    if (!prompt) {
      throw createError({
        statusCode: 400,
        statusMessage: "prompt is required for transform modes"
      });
    }
  }
  if (!fsPath) {
    throw createError({
      statusCode: 400,
      statusMessage: "File path is required"
    });
  }
  if (!collectionName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Collection name is required"
    });
  }
  const projectContext = aiConfig?.context;
  const experimentalCollectionContext = aiConfig?.experimental?.collectionContext ?? false;
  const context = await buildAIContext(event, {
    fsPath,
    collectionName,
    mode,
    projectContext,
    hintOptions,
    experimentalCollectionContext
  });
  const system = getSystem(mode || "continue", context, language);
  let finalPrompt;
  if (mode === "continue") {
    finalPrompt = previousContext;
    if (nextContext) {
      finalPrompt = `${previousContext}[CURSOR]${nextContext}`;
    }
  } else {
    finalPrompt = prompt;
  }
  const maxOutputTokens = calculateMaxTokens(selectionLength, mode || "continue", hintOptions);
  const modelName = mode === "continue" ? "anthropic/claude-haiku-4.5" : "anthropic/claude-sonnet-4.5";
  const temperature = mode === "continue" ? 0.7 : 0.3;
  return streamText({
    model: gateway.languageModel(modelName),
    system,
    prompt: finalPrompt,
    maxOutputTokens,
    temperature
  }).toTextStreamResponse();
});
