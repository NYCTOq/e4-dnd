export type BuilderGuidanceIssue = { id: string; severity: "error" | "warning"; step: string; message: string };

export function getBuilderGuidanceSummary(issues: readonly BuilderGuidanceIssue[]) {
  return {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    top: issues.slice(0, 3),
  };
}

export function shouldConfirmRulesetChange(input: { currentRuleset: string; nextRuleset: string; hasProgress: boolean }) {
  return input.currentRuleset !== input.nextRuleset && input.hasProgress;
}

export function normalizeBuilderStep(value: unknown, maxIndex: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= maxIndex ? parsed : 0;
}
