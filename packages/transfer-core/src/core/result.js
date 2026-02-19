export function buildReport(execution) {
  return {
    allowed: execution.validation.allowed,
    errors: execution.validation.errors,
    warnings: execution.validation.warnings,
    steps: execution.steps.map((step) => ({
      ruleId: step.rule.id,
      ruleName: step.rule.name,
      sources: step.resolvedSources.map((entry) => entry.meta),
      result: step.result,
      writes: step.writes
    }))
  };
}
