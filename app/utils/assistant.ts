/**
 * Extracts IDs between brackets from a given assistant name
 */
export function grabId(assistantName: string, key: string): string | null {
  const regex = new RegExp(`\\[${key}:(.*?)\\]`);
  const match = assistantName.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Remove any content within square brackets including the brackets themselves
 */
export function cleanName(assistantName: string) {
  return assistantName.replace(/\[.*?\]/g, '').trim();
}
