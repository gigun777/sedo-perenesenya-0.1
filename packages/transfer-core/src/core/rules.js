const SUPPORTED_MATH = new Set(["+", "-", "*", "/"]);

function normalizeSeparator(separator) {
  if (separator === "\\n") return "\n";
  return separator ?? "";
}

function toText(value, trim) {
  const raw = value == null ? "" : String(value);
  return trim ? raw.trim() : raw;
}

function runMath(mathOp, values) {
  let result = values[0] ?? 0;
  for (let i = 1; i < values.length; i += 1) {
    if (mathOp === "+") result += values[i];
    if (mathOp === "-") result -= values[i];
    if (mathOp === "*") result *= values[i];
    if (mathOp === "/") result /= values[i];
  }
  return result;
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : Number.NaN;
}

export function evaluateRule(rule, resolvedSources) {
  const inputValues = resolvedSources.map((item) => item.value);

  if (rule.op === "direct") {
    return { ok: true, value: inputValues[0], details: { op: "direct", inputs: inputValues } };
  }

  if (rule.op === "concat") {
    const trim = Boolean(rule.params?.trim);
    const skipEmpty = Boolean(rule.params?.skipEmpty);
    const separator = normalizeSeparator(rule.params?.separator);
    const prepared = inputValues.map((item) => toText(item, trim));
    const filtered = skipEmpty ? prepared.filter((item) => item !== "") : prepared;

    return {
      ok: true,
      value: filtered.join(separator),
      details: { op: "concat", separator, inputs: inputValues, prepared: filtered }
    };
  }

  if (rule.op === "math") {
    const mathOp = rule.params?.mathOp ?? "+";
    if (!SUPPORTED_MATH.has(mathOp)) {
      return { ok: false, value: null, error: "unsupported_math_op", details: { op: "math", mathOp, inputs: inputValues } };
    }

    const numbers = inputValues.map(toNumber);
    if (numbers.some((value) => Number.isNaN(value))) {
      return { ok: false, value: null, error: "math_non_numeric", details: { op: "math", mathOp, inputs: inputValues, numbers } };
    }

    let result = runMath(mathOp, numbers);
    if (typeof rule.params?.precision === "number") {
      result = Number(result.toFixed(rule.params.precision));
    }

    return {
      ok: true,
      value: result,
      details: { op: "math", mathOp, inputs: inputValues, numbers }
    };
  }

  return { ok: false, value: null, error: "unsupported_op", details: { op: rule.op, inputs: inputValues } };
}
