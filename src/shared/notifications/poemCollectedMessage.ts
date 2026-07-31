/** Canonical poem-collect copy — store history + toast API must stay in sync. */
export function buildPoemCollectedToastMessage(title: string): string {
  return `Стих собран: ${title}`;
}
