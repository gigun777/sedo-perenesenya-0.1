function getSchemaByJournal(plan, journalId) {
  if (plan.source.schema?.journalId === journalId) return plan.source.schema;
  if (plan.target.schema?.journalId === journalId) return plan.target.schema;
  return null;
}

function hasField(schema, fieldId) {
  return Boolean(schema?.fields?.some((field) => field.id === fieldId));
}

export function validate(execution, plan) {
  const errors = [];
  const warnings = [];

  for (const step of execution.steps) {
    if (step.rule.op === "math") {
      const strictMath = step.rule.params?.coerceNumeric !== "loose";
      if (strictMath) {
        const hasInvalid = step.resolvedSources.some((source) => !(typeof source.value === "number" && Number.isFinite(source.value)));
        if (hasInvalid) {
          errors.push({ ruleId: step.rule.id, code: "math_requires_number_strict" });
        }
      }
    }

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

    if (!step.resolvedTargets.length) {
      errors.push({ ruleId: step.rule.id, code: "empty_target" });
      continue;
    }

    for (const target of step.resolvedTargets) {
      if (!target?.fieldId) {
        errors.push({ ruleId: step.rule.id, code: "empty_target" });
        continue;
      }

      const schema = getSchemaByJournal(plan, target.journalId);
      if (!hasField(schema, target.fieldId)) {
        errors.push({ ruleId: step.rule.id, code: "target_field_not_found", target });
      }
    }

    if (step.result.ok && (step.result.value === "" || step.result.value == null)) {
      warnings.push({ ruleId: step.rule.id, code: "empty_result" });
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
