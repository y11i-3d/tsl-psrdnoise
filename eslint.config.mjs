import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([".astro/**", "dist*/**"]),
  {
    files: ["**/*.{js,mjs}"],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ["**/*.astro"],
    extends: [
      eslintPluginAstro.configs.recommended,
      tseslint.configs.recommended,
      eslintPluginAstro.configs.recommended,
    ],
  },
]);
