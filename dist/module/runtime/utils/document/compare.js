import { ContentFileExtension } from "../../types/content.js";
import { doObjectsMatch } from "../object.js";
import { renderMarkdown } from "comark/render";
import { documentFromContent } from "./generate.js";
import { cleanDataKeys } from "./schema.js";
import { comarkTreeFromLegacyDocument } from "./legacy.js";
const EMPTY_TREE = { nodes: [], frontmatter: {}, meta: {} };
function comarkBody(document) {
  return comarkTreeFromLegacyDocument(document) ?? EMPTY_TREE;
}
function normalizeAttrsDeep(tree) {
  return { ...tree, nodes: tree.nodes.map(normalizeNode) };
}
function unwrapLeadingDefaultSlot(children) {
  const [first, ...rest] = children;
  if (!Array.isArray(first) || first[0] !== "template") return children;
  const attrs = first[1] || {};
  if (attrs.name !== "default" || Object.keys(attrs).some((key) => key !== "name" && key !== "$")) {
    return children;
  }
  return [...first.slice(2), ...rest];
}
function normalizeNode(node) {
  if (typeof node === "string") return node;
  if (!Array.isArray(node)) return node;
  const [tag, attrs, ...children] = node;
  if (tag === null) return node;
  const sortedAttrs = attrs && typeof attrs === "object" ? Object.fromEntries(Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b))) : attrs;
  const normalizedChildren = unwrapLeadingDefaultSlot(children).map(normalizeNode);
  return [tag, sortedAttrs, ...normalizedChildren];
}
export async function isDocumentMatchingContent(content, document) {
  const generatedDocument = await documentFromContent(document.id, content, { compress: true, preserveLinkAttributes: true });
  if (generatedDocument.extension === ContentFileExtension.Markdown) {
    const generatedNormalized = normalizeAttrsDeep({ ...generatedDocument.body, frontmatter: {} });
    const documentNormalized = normalizeAttrsDeep({ ...comarkBody(document), frontmatter: {} });
    const generatedBodyStringified = (await renderMarkdown(generatedNormalized)).replace(/\n/g, "");
    const documentBodyStringified = (await renderMarkdown(documentNormalized)).replace(/\n/g, "");
    if (generatedBodyStringified !== documentBodyStringified) {
      return false;
    }
    return doObjectsMatch(
      cleanDataKeys(generatedDocument),
      cleanDataKeys(document)
    );
  }
  return doObjectsMatch(generatedDocument, document);
}
export async function areDocumentsEqual(document1, document2) {
  const { body: body1, meta: meta1, ...documentData1 } = document1;
  const { body: body2, meta: meta2, ...documentData2 } = document2;
  if (document1.extension === ContentFileExtension.Markdown) {
    if (await renderMarkdown(comarkBody(document1)) !== await renderMarkdown(comarkBody(document2))) {
      return false;
    }
  } else if (typeof body1 === "object" && typeof body2 === "object") {
    if (!doObjectsMatch(body1, body2)) {
      return false;
    }
  } else {
    if (JSON.stringify(body1) !== JSON.stringify(body2)) {
      return false;
    }
  }
  function refineDocumentData(doc) {
    if (doc.seo) {
      const seo = doc.seo;
      doc.seo = {
        ...seo,
        title: seo.title || doc.title,
        description: seo.description || doc.description
      };
    }
    Reflect.deleteProperty(doc, "__hash__");
    Reflect.deleteProperty(doc, "path");
    if (typeof doc.navigation === "undefined" || doc.navigation === "true") {
      doc.navigation = true;
    }
    for (const key in doc) {
      const value = doc[key];
      if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          doc[key] = new Date(value).toISOString().split("T")[0];
        }
      }
    }
    function removeNullAndUndefined(obj) {
      const result = {};
      for (const key in obj) {
        const value = obj[key];
        if (value === null || value === void 0) {
          continue;
        }
        if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
          result[key] = removeNullAndUndefined(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    return removeNullAndUndefined(doc);
  }
  const data1 = refineDocumentData({ ...documentData1, ...meta1 || {} });
  const data2 = refineDocumentData({ ...documentData2, ...meta2 || {} });
  if (!doObjectsMatch(data1, data2)) {
    return false;
  }
  return true;
}
