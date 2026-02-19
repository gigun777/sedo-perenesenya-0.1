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

    resolved.push({ value: undefined, meta: { kind: "unknown_source", source, error: "unsupported_source" } });
  }

  return resolved;
}
