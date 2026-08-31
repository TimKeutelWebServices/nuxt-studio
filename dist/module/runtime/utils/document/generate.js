import { consola } from "consola";
import { ContentFileExtension } from "../../types/content.js";
import { parse } from "comark";
import comarkEmoji from "comark/plugins/emoji";
import tocPlugin from "comark/plugins/toc";
import highlight from "comark/plugins/highlight";
import { renderMarkdown } from "comark/render";
import destr from "destr";
import yaml from "js-yaml";
import { useHostMeta } from "../../composables/useMeta.js";
import { addPageTypeFields, generateStemFromId, getFileExtension } from "./utils.js";
import { cleanDataKeys } from "./schema.js";
import { comarkTreeFromLegacyDocument, unbindComarkTree } from "./legacy.js";
const logger = consola.withTag("Nuxt Studio");
export async function documentFromContent(id, content, options = { compress: true }) {
  const [_id, _hash] = id.split("#");
  const extension = getFileExtension(id);
  if (extension === ContentFileExtension.Markdown) {
    return await documentFromMarkdownContent(id, content, options);
  }
  if (extension === ContentFileExtension.YAML || extension === ContentFileExtension.YML) {
    return await documentFromYAMLContent(id, content);
  }
  if (extension === ContentFileExtension.JSON) {
    return await documentFromJSONContent(id, content);
  }
  return null;
}
export async function documentFromYAMLContent(id, content) {
  const data = yaml.load(content) || {};
  let parsed = data;
  if (Array.isArray(data)) {
    logger.warn(`YAML array is not supported in ${id}, moving the array into the \`body\` key`);
    parsed = { body: data };
  }
  const document = {
    id,
    extension: getFileExtension(id),
    stem: generateStemFromId(id),
    meta: {},
    ...parsed
  };
  if (parsed.body) {
    document.body = parsed.body;
  }
  return document;
}
export async function documentFromJSONContent(id, content) {
  let parsed = destr(content);
  if (Array.isArray(parsed)) {
    logger.warn(`JSON array is not supported in ${id}, moving the array into the \`body\` key`);
    parsed = {
      body: parsed
    };
  }
  const document = {
    id,
    extension: ContentFileExtension.JSON,
    stem: generateStemFromId(id),
    meta: {},
    ...parsed
  };
  if (parsed.body) {
    document.body = parsed.body;
  }
  return document;
}
export function isComarkTree(body) {
  return typeof body === "object" && body !== null && Array.isArray(body.nodes);
}
export async function documentFromMarkdownContent(id, content, options = { compress: true }) {
  const highlightTheme = useHostMeta().highlightTheme.value;
  const themes = highlightTheme ? {
    default: highlightTheme.default || "github-light",
    dark: highlightTheme.dark || "github-dark",
    light: highlightTheme.light || "github-light"
  } : { default: "github-light", dark: "github-dark" };
  const tree = await parse(content, {
    autoClose: false,
    autoUnwrap: true,
    linkify: false,
    plugins: [
      comarkEmoji(),
      highlight({ themes }),
      tocPlugin({ depth: 2, searchDepth: 2, title: "", links: [] })
    ]
  });
  const result = {
    id,
    meta: {},
    extension: "md",
    stem: id.split("/").slice(1).join("/").split(".").slice(0, -1).join("."),
    body: tree,
    ...tree.frontmatter
  };
  if (options.collectionType === "page") {
    return addPageTypeFields(result);
  }
  return result;
}
export async function contentFromDocument(document) {
  const [id, _hash] = document.id.split("#");
  const extension = getFileExtension(id);
  if (extension === ContentFileExtension.Markdown) {
    return await contentFromMarkdownDocument(document);
  }
  if (extension === ContentFileExtension.YAML || extension === ContentFileExtension.YML) {
    return await contentFromYAMLDocument(document);
  }
  if (extension === ContentFileExtension.JSON) {
    return await contentFromJSONDocument(document);
  }
  return null;
}
export async function contentFromYAMLDocument(document) {
  return yaml.dump(cleanDataKeys(document), { lineWidth: -1 });
}
export async function contentFromJSONDocument(document) {
  return JSON.stringify(cleanDataKeys(document), null, 2);
}
export async function contentFromMarkdownDocument(document) {
  const tree = comarkTreeFromLegacyDocument(document);
  if (!tree) return "\n";
  const body = unbindComarkTree(tree);
  const markdown = await renderMarkdown(body, {
    blockAttributesStyle: "frontmatter"
  });
  return markdown.replace(/&#x2A;/g, "*") + "\n";
}
