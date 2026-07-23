const BLOCKED_PATTERNS: RegExp[] = [
  /child\s*sexual|csam|child\s*porn/i,
  /how\s+to\s+make\s+(a\s+)?bomb|explosive\s+device/i,
  /best\s+way\s+to\s+kill|murder\s+someone/i,
  /non[-\s]?consensual|rape/i,
];

export function assertPromptAllowed(text: string) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("Your request was blocked by safety checks.");
    }
  }
}
