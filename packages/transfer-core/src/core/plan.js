import { resolveSources } from "./extract.js";
import { evaluateRule } from "./rules.js";
import { applyWrites } from "./writer.js";
import { validate } from "./guards.js";
import { buildReport } from "./result.js";

function resolveTargetSpec(target, plan) {
  if (target?.cell) return target.cell;

  if (target?.targetRowFieldId) {
    return {
      journalId: plan.target.dataset.journalId,
      recordId: plan.context?.targetRecordId ?? plan.context?.currentRecordId ?? plan.selection?.recordIds?.[0] ?? null,
      fieldId: target.targetRowFieldId
    };
  }

  return null;
}

function createExecution(plan) {
  const ruleResults = new Map();
  const ctxBase = {
    sourceDataset: plan.source.dataset,
    targetDataset: plan.target.dataset,
    selection: plan.selection,
    context: plan.context,
    ruleResults
  };

  const steps = [];
  for (const rule of plan.template.rules ?? []) {
    const resolvedSources = resolveSources(rule.sources, ctxBase);
    const result = evaluateRule(rule, resolvedSources);
    const resolvedTargets = (rule.targets ?? [])
      .map((target) => resolveTargetSpec(target, plan))
      .filter(Boolean);

    ruleResults.set(rule.id, result.value);
    steps.push({ rule, resolvedSources, resolvedTargets, result });
  }

  return { steps };
}

export function buildTransferPlan(input) {
  return {
    template: input.template,
    source: input.source,
    target: input.target,
    selection: input.selection ?? { recordIds: [] },
    context: input.context ?? {}
  };
}

export function previewTransferPlan(plan) {
  const execution = createExecution(plan);
  const validation = validate(execution, plan);
  return buildReport(execution, validation);
}

export function applyTransferPlan(plan) {
  const execution = createExecution(plan);
  const validation = validate(execution, plan);
  const report = buildReport(execution, validation);

  if (!validation.allowed) {
    return {
      sourceNextDataset: plan.source.dataset,
      targetNextDataset: plan.target.dataset,
      report
    };
  }

  const writes = report.writes.map((item) => ({
    target: item.target,
    value: item.value,
    writeMode: item.writeMode
  }));

  const nextDatasets = applyWrites(
    {
      sourceDataset: plan.source.dataset,
      targetDataset: plan.target.dataset
    },
    writes
  );

  return {
    ...nextDatasets,
    report
  };
}
