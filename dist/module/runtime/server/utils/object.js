import { createDefu } from "defu";
const customDefu = createDefu((obj, key, value) => {
  if (obj[key] === "" && value !== void 0 && value !== null && value !== "") {
    obj[key] = value;
    return true;
  }
  if (obj[key] !== void 0 && obj[key] !== null) {
    return true;
  }
  return false;
});
export function mergeConfig(config, defaults) {
  return customDefu(defaults, config || {});
}
