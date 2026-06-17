/** Strip HTML-like markup from narrative strings — content is plain text only. */
export function sanitizePlainText(text: string): string {
  if (!text) return text;
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
