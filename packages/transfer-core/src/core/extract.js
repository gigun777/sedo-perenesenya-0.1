function getRecord(dataset, recordId) {
  return dataset?.records?.find((record) => record.id === recordId) ?? null;
}

function resolveCell(cellRef, ctx) {
  const dataset =
    cellRef.journalId === ctx.sourceDataset.journalId
      ? ctx.sourceDataset
      : cellRef.journalId === ctx.targetDataset.journalId
        ? ctx.targetDataset
        : null;

  if (!dataset) {
    return { value: undefined, meta: { kind: "cell", cellRef, error: "journal_not_found" } };
  }

  const record = getRecord(dataset, cellRef.recordId);
  if (!record) {
    return { value: undefined, meta: { kind: "cell", cellRef, error: "record_not_found" } };
  }

  return {
    value: record.cells?.[cellRef.fieldId],
    meta: { kind: "cell", cellRef }
  };
}

export function resolveSources(sources, ctx) {
  const resolved = [];

  for (const source of sources ?? []) {
    if (Object.hasOwn(source, "value")) {
      resolved.push({ value: source.value, meta: { kind: "value" } });
      continue;
    }

    if (source.cell) {
      resolved.push(resolveCell(source.cell, ctx));
      continue;
    }

    if (source.currentRowFieldId) {
      const recordId = ctx.context?.currentRecordId;
      const record = getRecord(ctx.sourceDataset, recordId);
      resolved.push({
        value: record?.cells?.[source.currentRowFieldId],
        meta: { kind: "current_row", recordId, fieldId: source.currentRowFieldId }
      });
      continue;
    }

    if (source.selectedRowsFieldId) {
      const recordIds = ctx.selection?.recordIds ?? [];
      for (const recordId of recordIds) {
        const record = getRecord(ctx.sourceDataset, recordId);
        resolved.push({
          value: record?.cells?.[source.selectedRowsFieldId],
          meta: { kind: "selected_row", recordId, fieldId: source.selectedRowsFieldId }
        });
      }
    }
  }

  return resolved;
}
