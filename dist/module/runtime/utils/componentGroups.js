import { minimatch } from "minimatch";
function matchAnyPattern(component, patterns) {
  return patterns.some((pattern) => {
    const value = pattern.includes("/") ? component.path : component.name;
    return minimatch(value, pattern);
  });
}
export function assignComponentsToGroups(components, groups, ungrouped, fallbackLabel) {
  const result = groups.map((g) => ({ label: g.label, components: [] }));
  const unmatched = [];
  for (const component of components) {
    let matched = false;
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group && matchAnyPattern(component, group.include)) {
        result[i].components.push(component);
        matched = true;
        break;
      }
    }
    if (!matched) {
      unmatched.push(component);
    }
  }
  const filtered = result.filter((g) => g.components.length > 0);
  if (ungrouped === "include" && unmatched.length > 0) {
    filtered.push({ label: fallbackLabel, components: unmatched });
  }
  return filtered;
}
