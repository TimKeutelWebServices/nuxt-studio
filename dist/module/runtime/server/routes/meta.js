import { eventHandler } from "h3";
import { useRuntimeConfig } from "#imports";
import components from "#nuxt-component-meta/nitro";
import { highlight } from "#mdc-imports";
import { filterComponents } from "../utils/meta.js";
import { requireStudioAuth } from "../utils/auth.js";
export default eventHandler(async (event) => {
  await requireStudioAuth(event);
  const config = useRuntimeConfig();
  const mappedComponents = Object.values(components).map(({ pascalName, filePath, meta }) => {
    return {
      name: pascalName,
      path: filePath,
      meta: {
        props: meta.props,
        slots: meta.slots,
        events: meta.events
      }
    };
  });
  const editorConfig = config.studio?.editor;
  const filteredComponents = filterComponents(
    mappedComponents,
    editorConfig?.components
  );
  const componentGroups = editorConfig?.components?.groups;
  const hasGroups = Array.isArray(componentGroups) && componentGroups.length > 0;
  const response = {
    markdownConfig: config.studio.markdown || {},
    highlightTheme: highlight?.theme || { default: "github-light", dark: "github-dark", light: "github-light" },
    components: {
      list: filteredComponents
    }
  };
  if (hasGroups) {
    response.components.groups = componentGroups.map((g) => ({ label: g.label, include: g.include }));
    const ungrouped = editorConfig?.components?.ungrouped;
    response.components.ungrouped = ungrouped === "omit" ? "omit" : "include";
  }
  return response;
});
