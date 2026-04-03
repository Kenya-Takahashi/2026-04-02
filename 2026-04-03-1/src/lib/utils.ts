export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function trimOrNull(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function splitTags(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return Array.from(new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean)));
}

export function buildNoteTitle(content: string) {
  const firstLine = content.split("\n")[0]?.trim() ?? "";

  if (firstLine.length <= 36) {
    return firstLine || "新規メモ";
  }

  return `${firstLine.slice(0, 36)}...`;
}
