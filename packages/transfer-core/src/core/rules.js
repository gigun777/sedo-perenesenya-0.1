function toText(value, trim) {
  if (value === null || value === undefined) return "";
  const normalized = String(value);
  return trim ? normalized.trim() : normalized;
}

function coerceNumber(value, mode = "strict") {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (mode === "loose") {
    const coerced = Number(value);
    return Number.isFinite(coerced) ? coerced : Number.NaN;
  }
  return Number.NaN;
}

export function evaluateRule(rule, resolvedSources) {
  const values = resolvedSources.map((entry) => entry.value);

  if (rule.op === "direct") {
    return {
      ok: true,
      value: values[0],
      details: { op: "direct", inputs: values }
    };
  }

  if (rule.op === "concat") {
    const separator = rule.params?.separator ?? "";
    const trim = Boolean(rule.params?.trim);
    const skipEmpty = Boolean(rule.params?.skipEmpty);
    const prepared = values.map((value) => toText(value, trim));
    const filtered = skipEmpty ? prepared.filter((value) => value !== "") : prepared;
    return {
      ok: true,
      value: filtered.join(separator),
      details: { op: "concat", separator, inputs: values, prepared: filtered }
    };
  }

  if (rule.op === "math") {
    const mathOp = rule.params?.mathOp ?? "+";
    const coerceMode = rule.params?.coerceNumeric ?? "strict";
    const precision = rule.params?.precision;
    const numbers = values.map((value) => coerceNumber(value, coerceMode));

    if (numbers.some((value) => Number.isNaN(value))) {
      return {
        ok: false,
        error: "math_non_numeric",
        value: null,
        details: { op: "math", inputs: values, numbers }
      };
    }

    let result = numbers[0] ?? 0;
    for (let i = 1; i < numbers.length; i += 1) {
      const next = numbers[i];
      if (mathOp === "+") result += next;
      if (mathOp === "-") result -= next;
      if (mathOp === "*") result *= next;
      if (mathOp === "/") result /= next;
    }

    if (typeof precision === "number") {
      result = Number(result.toFixed(precision));
    }

    return {
      ok: true,
      value: result,
      details: { op: "math", mathOp, inputs: values, numbers }
    };
  }

  return {
    ok: false,
    error: "unsupported_op",
    value: null,
    details: { op: rule.op, inputs: values }
  };
}
