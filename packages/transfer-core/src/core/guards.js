function isForbiddenTarget(target, ctx) {
  const forbiddenFieldIds = ctx.policies?.forbiddenTargetFieldIds ?? [];
  if (target.cell) return forbiddenFieldIds.includes(target.cell.fieldId);
  if (target.targetRowFieldId) return forbiddenFieldIds.includes(target.targetRowFieldId);
  return false;
}

export function validate(plan, ctx) {
  const errors = [];
  const warnings = [];

  for (const step of plan.steps) {
    if (!step.result.ok) {
      errors.push({ ruleId: step.rule.id, code: step.result.error ?? "rule_evaluation_failed" });
    }

    for (const target of step.rule.targets ?? []) {
      if (isForbiddenTarget(target, ctx)) {
        errors.push({ ruleId: step.rule.id, code: "forbidden_target", target });
      }
    }

    if ((step.rule.targets ?? []).length === 0) {
      warnings.push({ ruleId: step.rule.id, code: "rule_without_targets" });
    }
  }

  return { allowed: errors.length === 0, errors, warnings };
}
