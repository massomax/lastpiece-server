// Курсор для сортировки: rankScore DESC, shuffleKey DESC, _id DESC
export type CursorTriplet = { r: number; s: number; id: string };

export function encodeCursor(cur: CursorTriplet): string {
  return Buffer.from(JSON.stringify(cur)).toString("base64");
}

export function decodeCursor(s?: string | null): CursorTriplet | null {
  if (!s) return null;
  try {
    return JSON.parse(Buffer.from(s, "base64").toString());
  } catch {
    return null;
  }
}