/**
 * Test type augmentations.
 *
 * The vitest setup file (`vitest/setupComponentTests.ts`) imports
 * `@testing-library/jest-dom/vitest` at runtime to augment vitest's
 * `Assertion` interface with DOM matchers (toBeInTheDocument, toHaveTextContent, etc.).
 *
 * This declaration file ensures tsc processes the same augmentation at compile
 * time, so type-checking of test files resolves jest-dom matchers correctly.
 */
import '@testing-library/jest-dom/vitest';
