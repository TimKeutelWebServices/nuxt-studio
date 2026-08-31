import { compressTree, decompressTree } from "@nuxt/content/runtime";
import { generateFlatToc } from "comark/plugins/toc";
import { cleanDataKeys } from "./schema.js";
import { isComarkTree } from "./generate.js";
function comarkToMDC(tree) {
  return {
    type: "root",
    children: tree.nodes.map(comarkNodeToMDCNode)
  };
}
function comarkNodeToMDCNode(node) {
  if (typeof node === "string") {
    return { type: "text", value: node };
  }
  if (Array.isArray(node)) {
    const [tag, attrs, ...children] = node;
    if (tag === null) {
      return { type: "comment", value: children[0] };
    }
    return {
      type: "element",
      tag,
      props: propsComarkToMDC(tag, attrs || {}),
      children: children.map(comarkNodeToMDCNode)
    };
  }
  return { type: "text", value: "" };
}
function mdcToComark(root, data = {}) {
  const repaired = repairMdcRoot(root);
  return {
    nodes: normalizeMdcChildren(repaired.children || []).map(mdcNodeToComarkNode),
    frontmatter: data,
    meta: {}
  };
}
function mdcNodeToComarkNode(node) {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type === "comment") {
    return [null, {}, node.value];
  }
  if (node.type === "element") {
    const el = node;
    if (el.tag === "pre") return preMdcToComarkNode(el);
    const children = normalizeMdcChildren(el.children || []);
    return [
      el.tag,
      propsMDCToComark(el.tag, el.props || {}),
      ...children.map(mdcNodeToComarkNode)
    ];
  }
  return "";
}
function preMdcToComarkNode(el) {
  const { code, ...rest } = el.props || {};
  const attrs = propsMDCToComark("pre", rest);
  if (typeof code === "string") {
    const canonicalCode = code.endsWith("\n") ? code.slice(0, -1) : code;
    return ["pre", attrs, ["code", { __ignoreMap: "" }, canonicalCode]];
  }
  const children = normalizeMdcChildren(el.children || []);
  return ["pre", attrs, ...children.map(mdcNodeToComarkNode)];
}
function repairMdcRoot(root) {
  const sentinel = {
    type: "element",
    tag: "__root_sentinel__",
    props: {},
    children: root.children || []
  };
  const repaired = repairMdcNode(sentinel);
  return {
    type: "root",
    children: [...repaired.node.children || [], ...repaired.leak]
  };
}
function repairMdcNode(node) {
  if (node.type !== "element") {
    return { node, leak: [], promote: 0 };
  }
  const el = node;
  const recursed = (el.children || []).map(repairMdcNode);
  const newChildren = [];
  const leakUp = [];
  let promoteUp = 0;
  for (const r of recursed) {
    newChildren.push(r.node);
    if (r.leak.length === 0 && r.promote === 0) continue;
    if (r.promote === 0) {
      newChildren.push(...r.leak);
      continue;
    }
    leakUp.push(...r.leak);
    promoteUp = Math.max(promoteUp, r.promote - 1);
  }
  if (isMdcContainer(el)) {
    const artifactIdx = newChildren.findIndex(isClosingMarkerArtifact);
    if (artifactIdx !== -1) {
      const artifact = newChildren[artifactIdx];
      const before = newChildren.slice(0, artifactIdx).map((c) => stripWrappingIndentFromPre(c));
      const after = newChildren.slice(artifactIdx + 1);
      const text = artifact.children?.[0]?.value || "";
      const closeLines = text.split("\n").filter((l) => /^:{2,}$/.test(l.trim())).length;
      return {
        node: { ...el, children: before },
        leak: [...after, ...leakUp],
        promote: Math.max(0, closeLines - 1) + promoteUp
      };
    }
  }
  return {
    node: { ...el, children: newChildren },
    leak: leakUp,
    promote: promoteUp
  };
}
function isMdcContainer(el) {
  const tag = el.tag;
  if (!tag) return false;
  if (tag === "__root_sentinel__") return false;
  if (tag === "template") return true;
  return !HTML_BLOCK_TAGS.has(tag) && !HTML_INLINE_TAGS.has(tag);
}
function isClosingMarkerArtifact(node) {
  if (node.type !== "element") return false;
  const el = node;
  if (el.tag !== "p") return false;
  if (!el.children || el.children.length !== 1) return false;
  const child = el.children[0];
  if (child?.type !== "text") return false;
  return /^\s*:{2,}(\s*\n\s*:{2,})*\s*$/.test(child.value);
}
function stripWrappingIndentFromPre(node) {
  if (node.type !== "element") return node;
  const el = node;
  if (el.tag !== "pre") return node;
  const code = el.props?.code;
  if (typeof code !== "string") return node;
  const indent = commonLeadingWhitespace(code);
  if (!indent) return node;
  const stripped = code.split("\n").map((line) => line.startsWith(indent) ? line.slice(indent.length) : line).join("\n");
  return { ...el, props: { ...el.props, code: stripped } };
}
function commonLeadingWhitespace(text) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return "";
  let common = lines[0]?.match(/^\s*/)?.[0] || "";
  for (let i = 1; i < lines.length && common.length > 0; i++) {
    const lws = lines[i]?.match(/^\s*/)?.[0] || "";
    let j = 0;
    while (j < common.length && j < lws.length && common[j] === lws[j]) j++;
    common = common.slice(0, j);
  }
  return common;
}
const HTML_BLOCK_TAGS = /* @__PURE__ */ new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "details",
  "dialog",
  "dd",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "iframe",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
  "video",
  "template"
]);
const HTML_INLINE_TAGS = /* @__PURE__ */ new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "img",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  "del",
  "ins"
]);
function isMdcBlockChild(node) {
  if (node.type !== "element") return false;
  const tag = node.tag;
  return tag !== void 0 && HTML_BLOCK_TAGS.has(tag);
}
function isMdcInlineChild(node) {
  if (node.type === "text") return true;
  if (node.type !== "element") return false;
  const tag = node.tag;
  return tag !== void 0 && HTML_INLINE_TAGS.has(tag);
}
function normalizeMdcChildren(children) {
  const hasBlock = children.some(isMdcBlockChild);
  const hasInline = children.some(isMdcInlineChild);
  if (!hasBlock || !hasInline) return children;
  const result = [];
  let inlineBuf = [];
  const flush = () => {
    if (inlineBuf.length === 0) return;
    const hasContent = inlineBuf.some(
      (c) => c.type === "element" || c.type === "text" && c.value.trim().length > 0
    );
    if (hasContent) {
      result.push({
        type: "element",
        tag: "p",
        props: {},
        children: inlineBuf
      });
    }
    inlineBuf = [];
  };
  for (const child of children) {
    if (isMdcInlineChild(child)) {
      inlineBuf.push(child);
    } else {
      flush();
      result.push(child);
    }
  }
  flush();
  return result;
}
function propsMDCToComark(tag, props) {
  const { props: unbound, unbound: unboundKeys } = unbindMDCProps(props);
  let next = unbound;
  if (tag === "template") {
    const vSlotKey = Object.keys(next).find((k) => k.startsWith("v-slot:"));
    if (vSlotKey) {
      const slotName = vSlotKey.slice("v-slot:".length) || "default";
      const { [vSlotKey]: _omit, ...rest } = next;
      next = { name: slotName, ...rest };
    }
  }
  if ("className" in next) {
    const { className, ...rest } = next;
    const classStr = Array.isArray(className) ? className.join(" ") : String(className ?? "");
    if (classStr) {
      next = { ...rest, class: typeof rest.class === "string" ? `${rest.class} ${classStr}` : classStr };
    } else {
      next = rest;
    }
  }
  if ("rel" in next) {
    const { rel: _rel, ...rest } = next;
    next = rest;
  }
  for (const key in next) {
    if (unboundKeys.has(key)) continue;
    const value = next[key];
    if (Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      next[key] = value.join(" ");
    }
  }
  return next;
}
function unbindMDCProps(props) {
  const next = {};
  const unbound = /* @__PURE__ */ new Set();
  for (const [rawKey, value] of Object.entries(props)) {
    if (rawKey.startsWith(":") && typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "boolean") {
          next[rawKey] = value;
        } else {
          const key = rawKey.slice(1);
          next[key] = parsed;
          unbound.add(key);
        }
      } catch {
        next[rawKey] = value;
      }
    } else {
      next[rawKey] = value;
    }
  }
  return { props: next, unbound };
}
export function unbindComarkTree(tree) {
  return { ...tree, nodes: tree.nodes.map(unbindComarkNode) };
}
function unbindComarkNode(node) {
  if (!Array.isArray(node)) return node;
  const [tag, attrs, ...children] = node;
  if (tag === null) return node;
  return [
    tag,
    unbindMDCBlockProps(attrs || {}),
    ...children.map(unbindComarkNode)
  ];
}
function unbindMDCBlockProps(props) {
  const next = {};
  for (const [rawKey, value] of Object.entries(props)) {
    if (rawKey.startsWith(":") && typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed !== null && typeof parsed === "object") {
          next[rawKey.slice(1)] = parsed;
          continue;
        }
      } catch {
      }
    }
    next[rawKey] = value;
  }
  return next;
}
function propsComarkToMDC(tag, attrs) {
  let next = attrs;
  if (tag === "template" && typeof next.name === "string") {
    const { name, ...rest } = next;
    next = { ...rest, [`v-slot:${name}`]: "" };
  }
  if (typeof next.class === "string") {
    const { class: classStr, ...rest } = next;
    const classes = classStr.split(/\s+/).filter(Boolean);
    if (classes.length) {
      next = { ...rest, className: classes };
    } else {
      next = rest;
    }
  }
  return next;
}
export function comarkTreeFromLegacyDocument(document) {
  if (!document.body) return null;
  if (isComarkTree(document.body)) return document.body;
  const body = document.body.type === "minimark" ? decompressTree(document.body) : document.body;
  return mdcToComark(body, cleanDataKeys(document));
}
export function ensureComarkBody(document) {
  if (document.extension !== "md" || !document.body) return document;
  if (isComarkTree(document.body)) return document;
  const comarkTree = comarkTreeFromLegacyDocument(document);
  if (!comarkTree) return document;
  return { ...document, body: comarkTree };
}
export function markdownRootFromComarkTree(tree) {
  const mdcBody = comarkToMDC(tree);
  const compressedBody = compressTree(mdcBody);
  const toc = generateFlatToc(tree, { title: "", depth: 2, searchDepth: 2, links: [] });
  return { ...compressedBody, toc };
}
