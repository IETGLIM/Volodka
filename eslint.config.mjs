import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Глобальные ignores — первым блоком (ESLint flat config: иначе правила с других конфигов
// по-прежнему обходят `scripts/optimize-models/**` и т.д.).
// См. https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files
const globalIgnores = {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "browserbase-functions/**",
    "exports/**",
    "**/next-env.d.ts",
    "examples/**",
    "skills",
    "_volodka_upstream_check/**",
    "scripts/optimize-models/**",
  ],
};

// Конфиги Next.js уже являются массивами, не функциями
const eslintConfig = [
  globalIgnores,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-unused-disable-directive": "off",
      
      // React rules
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react-compiler/react-compiler": "off",
      
      // Next.js rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      
      // General JavaScript rules
      "prefer-const": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "off",
      "no-useless-escape": "off",
    },
  },
];

export default eslintConfig;
