/**
 * Fill `{name}` placeholders in a translated message. Every occurrence is replaced;
 * placeholders without a matching variable are left as written.
 */
export function formatMessage(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : placeholder
  );
}
