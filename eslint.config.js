import typescriptEslint from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import prettier from "eslint-plugin-prettier"
import prettierConfig from "eslint-config-prettier"

export default [
  {
    ignores: [
      "dist/",
      "node_modules/",
      "coverage/",
      ".husky/",
      "tmp/",
      "tests/tmp/",
      "tests/fixtures/",
    ],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettier,
    },
    rules: {
      ...typescriptEslint.configs["recommended"].rules,
      ...typescriptEslint.configs["recommended-requiring-type-checking"].rules,
      ...prettierConfig.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "prettier/prettier": "error",
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettier,
    },
    rules: {
      ...typescriptEslint.configs["recommended"].rules,
      ...prettierConfig.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "prettier/prettier": "error",
    },
  },
]
