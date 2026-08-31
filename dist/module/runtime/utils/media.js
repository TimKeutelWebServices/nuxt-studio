import { join } from "pathe";
import { withLeadingSlash } from "ufo";
import { VIRTUAL_MEDIA_COLLECTION_NAME } from "./constants.js";
export function generateIdFromFsPath(fsPath) {
  return join(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath);
}
export function mediaItemFieldsFromKey(key) {
  const fsPath = withLeadingSlash(key.replace(/:/g, "/"));
  return {
    id: generateIdFromFsPath(fsPath),
    extension: key.split(".").pop() || "",
    stem: fsPath.split(".").slice(0, -1).join("."),
    path: fsPath,
    fsPath
  };
}
