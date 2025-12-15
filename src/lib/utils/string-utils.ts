/**
 * Converts a string to title case (first letter capitalized, rest lowercase)
 * @param str - The string to convert
 * @returns The title-cased string
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

