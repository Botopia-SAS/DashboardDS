import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-interface": "off", // 🚀 Desactiva esta regla
      "@typescript-eslint/no-explicit-any": "warn", // ⚠ Lo deja como advertencia en vez de error
      "@typescript-eslint/no-empty-interface": "off",
    },
  },
];

export default eslintConfig;

