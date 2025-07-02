import fs from "fs";
import path from "path";

// Function to load request body from JSON
export const loadRequestBody = (key) => {
  const dataPath = path.resolve("./test-data/apiRequestBodies.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const requestBodies = JSON.parse(raw);
  return requestBodies[key];
};

// Utility: Apply overrides with support for dot notation
export const applyOverrides = (base, overrides) => {
  for (const key in overrides) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let ref = base;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!ref[parts[i]]) ref[parts[i]] = {};
        ref = ref[parts[i]];
      }
      ref[parts[parts.length - 1]] = overrides[key];
    } else {
      base[key] = overrides[key];
    }
  }
  return base;
};
