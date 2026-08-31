import { getOrderedSchemaKeys } from "../collection.js";
import { omit, pick } from "../object.js";
import { addPageTypeFields } from "./utils.js";
export const reservedKeys = ["id", "fsPath", "stem", "extension", "__hash__", "path", "body", "meta", "rawbody"];
export function applyCollectionSchema(id, collectionInfo, document) {
  let parsedContent = { ...document, id };
  if (collectionInfo.type === "page") {
    parsedContent = addPageTypeFields(parsedContent);
  }
  const result = { id };
  const meta = parsedContent.meta;
  const collectionKeys = getOrderedSchemaKeys(collectionInfo.schema);
  for (const key of Object.keys(parsedContent)) {
    if (collectionKeys.includes(key)) {
      result[key] = parsedContent[key];
    } else {
      meta[key] = parsedContent[key];
    }
  }
  if (meta.fsPath) {
    Reflect.deleteProperty(meta, "fsPath");
  }
  result.meta = meta;
  if (collectionKeys.includes("seo")) {
    const seo = { ...result.seo || {} };
    seo.title = seo.title || result.title;
    seo.description = seo.description || result.description;
    result.seo = seo;
  }
  return result;
}
export function pickReservedKeysFromDocument(document) {
  return pick(document, reservedKeys);
}
export function cleanDataKeys(document) {
  const result = omit(document, reservedKeys);
  if (result.navigation === true || result.navigation === "true") {
    Reflect.deleteProperty(result, "navigation");
  }
  if (document.seo) {
    const seo = { ...document.seo };
    if (!seo.title || seo.title === document.title) {
      Reflect.deleteProperty(seo, "title");
    }
    if (!seo.description || seo.description === document.description) {
      Reflect.deleteProperty(seo, "description");
    }
    if (Object.keys(seo).length === 0) {
      Reflect.deleteProperty(result, "seo");
    } else {
      result.seo = seo;
    }
  }
  if (!document.title) {
    Reflect.deleteProperty(result, "title");
  }
  if (!document.description) {
    Reflect.deleteProperty(result, "description");
  }
  for (const key in document.meta || {}) {
    if (!reservedKeys.includes(key)) {
      result[key] = document.meta[key];
    }
  }
  for (const key in result || {}) {
    if (result[key] === null) {
      Reflect.deleteProperty(result, key);
    }
    if (Array.isArray(result[key]) && result[key].length === 0) {
      Reflect.deleteProperty(result, key);
    }
  }
  return result;
}
