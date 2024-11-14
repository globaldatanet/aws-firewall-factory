import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [{
  ignores: [
    "**/node_modules/",
    "**/dist/",
    "**/cdk.out/",
    "**/cdk.context.json",
    "**/cdk",
    ".github/enumcheck.ts",
    "jest.config.js"
  ],
}, ...compat.extends(
  "eslint:recommended",
  "plugin:@typescript-eslint/eslint-recommended",
  "plugin:@typescript-eslint/recommended",
), {
  plugins: {
    "@typescript-eslint": typescriptEslint,
  },

  languageOptions: {
    parser: tsParser,
  },

  rules: {
    semi: [2, "always"],
    eqeqeq: 2,

    indent: [2, 2, {
      SwitchCase: 1,
    }],

    quotes: ["error", "double"],
    "linebreak-style": "off",
    "array-bracket-newline": "off",
    "array-bracket-spacing": ["error", "never"],
    "no-trailing-spaces": "off",
    "padded-blocks": "off",
    "arrow-body-style": "off",
    "init-declarations": "off",
    "comma-dangle": "off",

    "keyword-spacing": [0, {
      before: true,
      after: true,
      overrides: null,
    }],

    "prefer-template": "off",
    "id-blacklist": "off",
    "no-console": "off",
    "no-sync": "off",
    complexity: "off",
    "max-statements": "off",
    "array-element-newline": "off",
    "object-curly-spacing": "off",
    "template-curly-spacing": "off",
    camelcase: "off",
    "no-use-before-define": "off",
    "id-length": "off",
    "id-match": "off",
    "max-len": "off",
    "no-magic-numbers": "off",
    "no-underscore-dangle": "off",
    "no-process-env": "off",

    "func-style": ["error", "declaration", {
      allowArrowFunctions: true,
    }],

    "no-useless-escape": "off",
  },
}];