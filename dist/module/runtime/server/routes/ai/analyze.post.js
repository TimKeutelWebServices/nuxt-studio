import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { eventHandler, createError, readBody } from "h3";
import { consola } from "consola";
import { useRuntimeConfig } from "#imports";
import { requireStudioAuth } from "../../utils/auth.js";
import { queryCollection } from "@nuxt/content/server";
import {
  detectContentType,
  analyzeArchitecture,
  buildProjectInfoContext,
  buildAnalysisPrompt,
  getAnalyzeSystem
} from "../../utils/ai/analyze.js";
import { ContentType } from "../../types/ai.js";
const logger = consola.withTag("Nuxt Studio");
export default eventHandler(async (event) => {
  await requireStudioAuth(event);
  const config = useRuntimeConfig(event);
  const body = await readBody(event).catch(() => ({}));
  const collection = body.collection;
  if (!collection) {
    throw createError({
      statusCode: 400,
      statusMessage: "Collection info is required"
    });
  }
  if (!collection.name || !collection.type) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid collection: name and type are required"
    });
  }
  const aiConfig = config.studio?.ai;
  const apiKey = aiConfig?.apiKey;
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "AI features are not enabled. Please set NUXT_STUDIO_AI_API_KEY environment variable."
    });
  }
  const gateway = createGateway({ apiKey });
  const projectContext = aiConfig?.context;
  const projectInfo = buildProjectInfoContext(projectContext);
  const contentSamples = [];
  const MAX_SAMPLES = 30;
  const MAX_EXCERPT_LENGTH = 600;
  const sourceInfo = collection.source && collection.source.length > 0 ? collection.source.map((s) => s.include || s.prefix).filter(Boolean).join(", ") : "default";
  const collectionMetadata = {
    name: collection.name,
    type: collection.type || "page",
    source: sourceInfo,
    totalDocuments: 0,
    contentType: ContentType.GeneralContent,
    architecture: {
      fileTree: "",
      usesNestedFolders: false,
      depth: 0,
      structure: ""
    }
  };
  try {
    const documents = await queryCollection(event, collection.name).limit(MAX_SAMPLES).where("extension", "=", "md").all();
    collectionMetadata.totalDocuments = documents.length;
    if (documents.length > 0) {
      collectionMetadata.contentType = detectContentType(documents);
      collectionMetadata.architecture = analyzeArchitecture(documents);
    }
    for (const document of documents) {
      if (contentSamples.length >= MAX_SAMPLES) {
        break;
      }
      let excerpt = "";
      try {
        const { contentFromDocument } = await import("../../../utils/document/generate.js");
        const rawContent = await contentFromDocument(document);
        if (rawContent) {
          excerpt = rawContent;
        }
      } catch (err) {
        logger.warn("Failed to generate content from document:", err);
        if (document.description) {
          excerpt = document.description;
        }
      }
      if (excerpt.length > MAX_EXCERPT_LENGTH) {
        excerpt = excerpt.substring(0, MAX_EXCERPT_LENGTH) + "...";
      }
      if (excerpt) {
        contentSamples.push({
          title: document.title || document.path || "Untitled",
          description: document.description,
          excerpt
        });
      }
    }
  } catch (error) {
    logger.error("[AI] Error querying collection:", error);
  }
  if (contentSamples.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `No markdown content found in collection "${collection.name}". Cannot analyze empty collection.`
    });
  }
  const prompt = buildAnalysisPrompt(
    contentSamples,
    collectionMetadata,
    projectInfo
  );
  const system = getAnalyzeSystem();
  return streamText({
    model: gateway.languageModel("anthropic/claude-sonnet-4.5"),
    system,
    prompt,
    maxOutputTokens: 2e3
  }).toTextStreamResponse();
});
