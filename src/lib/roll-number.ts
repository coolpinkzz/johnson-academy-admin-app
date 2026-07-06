export const ROLL_NUMBER_PATTERN = /^JA\/([A-Z]{3}|\d{4})\/\d{4}$/;

export const ROLL_NUMBER_ERROR_MESSAGE =
  "Roll number must be in format JA/MMYY/NNNN (e.g. JA/0726/3072)";

export const ROLL_NUMBER_PLACEHOLDER = "e.g. JA/0726/3072";

export function isValidRollNumber(value: string): boolean {
  return ROLL_NUMBER_PATTERN.test(value.trim());
}

export function getRollNumberPrefix(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `JA/${month}${year}/`;
}

export function looksLikeRollNumberSearch(query: string): boolean {
  return query.trim().toUpperCase().startsWith("JA/");
}

export function suggestNextRollNumber(
  students: { rollNumber?: string }[],
  date: Date = new Date(),
): string {
  const prefix = getRollNumberPrefix(date);
  const escapedPrefix = prefix.replace(/\//g, "\\/");
  const newFormatPattern = new RegExp(`^${escapedPrefix}(\\d{4})$`);

  let maxSequence = 0;

  for (const student of students) {
    const roll = student.rollNumber?.trim();
    if (!roll) continue;

    const match = roll.match(newFormatPattern);
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }

  const nextSequence = String(maxSequence + 1).padStart(4, "0");
  return `${prefix}${nextSequence}`;
}
