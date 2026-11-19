// Central thresholds for the rules engine. In a later phase these become
// user-editable in a Settings page; for now they are sensible defaults.
export const RULE_CONFIG = {
  title: { maxChars: 60, minChars: 15 },
  description: { maxChars: 160, minChars: 70 },
  image: { largeBytes: 100 * 1024 }, // flag images over 100 KB
  score: { errorWeight: 12, warningWeight: 4 },
} as const;
