function getDatasetByJournalId(ctx, journalId) {
  if (ctx.sourceDataset?.journalId === journalId) return ctx.sourceDataset;
  if (ctx.targetDataset?.journalId === journalId) return ctx.targetDataset;
  return null;
}

function getRecordById(dataset, recordId) {
  return dataset?.records?.find((record) => record.id === recordId) ?? null;
}

function resolveCellSource(cellRef, ctx) {
  const dataset = getDatasetByJournalId(ctx, cellRef.journalId);
  if (!dataset) {
    return {
      value: undefined,
      meta: { kind: "cell", cell: cellRef, error: "journal_not_found" }
    };
  }

  const record = getRecordById(dataset, cellRef.recordId);
  if (!record) {
    return {
      value: undefined,
      meta: { kind: "cell", cell: cellRef, error: "record_not_found" }
    };
  }

  return {
    value: record.cells?.[cellRef.fieldId],
    meta: { kind: "cell", cell: cellRef }
  };
}

function resolveCurrentRowSource(fieldId, ctx) {
  const recordId = ctx.context?.currentRecordId;
  const record = getRecordById(ctx.sourceDataset, recordId);
  return {
    value: record?.cells?.[fieldId],
    meta: { kind: "current_row", recordId, fieldId }
  };
}

function resolveSelectedRowsSource(fieldId, ctx) {
  const recordIds = ctx.selection?.recordIds ?? [];
  return recordIds.map((recordId) => {
    const record = getRecordById(ctx.sourceDataset, recordId);
    return {
      value: record?.cells?.[fieldId],
      meta: { kind: "selected_row", recordId, fieldId }
    };
  });
}

function resolveRuleResultSource(source, ctx) {
  const ruleId = source.ruleResultId ?? source.ruleResult?.ruleId;
  if (!ruleId) {
    return {
      value: undefined,
      meta: { kind: "rule_result", error: "rule_result_id_missing" }
    };
  }

  if (!ctx.ruleResults?.has(ruleId)) {
    return {
      value: undefined,
      meta: { kind: "rule_result", ruleId, error: "rule_result_not_found" }
    };
  }

  return {
    value: ctx.ruleResults.get(ruleId),
    meta: { kind: "rule_result", ruleId }
  };
}

export function resolveSources(sources, ctx) {
  const resolved = [];

  for (const source of sources ?? []) {
    if (source?.cell) {
      resolved.push(resolveCellSource(source.cell, ctx));
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(source ?? {}, "value")) {
      resolved.push({ value: source.value, meta: { kind: "value" } });
      continue;
    }

    if (source?.currentRowFieldId) {
      resolved.push(resolveCurrentRowSource(source.currentRowFieldId, ctx));
      continue;
    }

    if (source?.selectedRowsFieldId) {
      resolved.push(...resolveSelectedRowsSource(source.selectedRowsFieldId, ctx));
      continue;
    }

    if (source?.ruleResultId || source?.ruleResult) {
      resolved.push(resolveRuleResultSource(source, ctx));
      continue;
    }

    resolved.push({ value: undefined, meta: { kind: "unknown_source", source, error: "unsupported_source" } });
  }

  return resolved;
}
