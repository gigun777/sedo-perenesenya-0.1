import assert from "node:assert/strict";
import {
  buildTransferPlan,
  previewTransferPlan,
  applyTransferPlan
} from "./src/index.js";

const sourceDataset = {
  journalId: "A",
  records: [
    {
      id: "r1",
      cells: {
        firstName: "Іван",
        lastName: "Петренко"
      }
    }
  ]
};

const targetDataset = {
  journalId: "B",
  records: [
    {
      id: "r1",
      cells: {
        fullName: ""
      }
    }
  ]
};

const schema = {
  journalId: "A",
  fields: []
};

const template = {
  id: "tpl-1",
  title: "Concat full name",
  rules: [
    {
      id: "rule-1",
      name: "Join names",
      sources: [{ currentRowFieldId: "firstName" }, { currentRowFieldId: "lastName" }],
      op: "concat",
      params: { separator: " ", trim: true, skipEmpty: true },
      targets: [{ targetRowFieldId: "fullName" }],
      write: { mode: "replace" }
    }
  ]
};

const plan = buildTransferPlan({
  template,
  source: { schema, dataset: sourceDataset },
  target: { schema: { ...schema, journalId: "B" }, dataset: targetDataset },
  selection: { recordIds: ["r1"] },
  context: { currentRecordId: "r1", targetRecordId: "r1" }
});

const preview = previewTransferPlan(plan);
assert.equal(preview.allowed, true);
assert.equal(preview.steps[0].result.value, "Іван Петренко");

const applied = applyTransferPlan(plan);
assert.equal(applied.targetNextDataset.records[0].cells.fullName, "Іван Петренко");

console.log("transfer-core smoke test passed");
