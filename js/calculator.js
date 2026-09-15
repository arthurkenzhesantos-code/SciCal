(() => {
  "use strict";

  const state = {
    expression: "",
    lastResult: 0,
    memory: 0,
    angleMode: "DEG",
    mode: "scientific",
    justEvaluated: false
  };

  const $ = id => document.getElementById(id);
  const expressionEl = $("expression");
  const resultEl = $("result");
  const errorEl = $("error");
  const angleEl = $("angleMode");
  const memoryEl = $("memoryIndicator");
  const keypad = $("keypad");

  function format(value) {
    if (!Number.isFinite(value)) throw new Error("Result is outside the supported range.");
    if (Object.is(value, -0)) value = 0;
    const abs = Math.abs(value);
    if ((abs >= 1e12 || (abs > 0 && abs < 1e-10))) {
      return value.toExponential(10).replace(/\.?0+e/, "e");
    }
    return Number(value.toPrecision(12)).toLocaleString("en-US", {
      maximumFractionDigits: 12,
      useGrouping: true
    });
  }

  function normalizeInput(text) {
    return text
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/g, "pi")
      .replace(/\s+/g, "");
  }

  function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const c = input[i];
      if (/[0-9.]/.test(c)) {
        let start = i;
        let dots = 0;
        while (i < input.length && /[0-9.]/.test(input[i])) {
          if (input[i] === ".") dots++;
          i++;
        }
        if (dots > 1) throw new Error("Invalid number.");
        if (i < input.length && /[eE]/.test(input[i])) {
          i++;
          if (/[+-]/.test(input[i])) i++;
          const expStart = i;
          while (i < input.length && /[0-9]/.test(input[i])) i++;
          if (expStart === i) throw new Error("Invalid exponent.");
        }
        tokens.push({ type: "number", value: Number(input.slice(start, i)) });
      } else if (/[A-Za-z]/.test(c)) {
        let start = i;
        while (i < input.length && /[A-Za-z]/.test(input[i])) i++;
        tokens.push({ type: "name", value: input.slice(start, i).toLowerCase() });
      } else if ("+-*/^()%!".includes(c)) {
        tokens.push({ type: c, value: c });
        i++;
      } else {
        throw new Error(`Unsupported character: ${c}`);
      }
    }
    return tokens;
  }

  function evaluate(input) {
    const normalized = normalizeInput(input);
    if (!normalized) return 0;
    if (normalized.length > 300) throw new Error("Expression is too long.");

    const tokens = tokenize(normalized);
    let pos = 0;

    function peek(type) {
      return tokens[pos]?.type === type;
    }

    function accept(type) {
      if (peek(type)) return tokens[pos++];
      return null;
    }

    function primary() {
      if (accept("(")) {
        const value = addSub();
        if (!accept(")")) throw new Error("Missing closing parenthesis.");
        return value;
      }

      const number = accept("number");
      if (number) return number.value;

      const name = accept("name");
      if (name) {
        if (name.value === "pi") return Math.PI;
        if (name.value === "e") return Math.E;
        if (name.value === "ans") return state.lastResult;

        const functions = {
          sin: CalcFunctions.sin,
          cos: CalcFunctions.cos,
          tan: CalcFunctions.tan,
          asin: CalcFunctions.asin,
          acos: CalcFunctions.acos,
          atan: CalcFunctions.atan,
          log: CalcFunctions.log,
          ln: CalcFunctions.ln,
          sqrt: CalcFunctions.sqrt
        };

        if (!functions[name.value]) throw new Error(`Unknown function: ${name.value}.`);
        let value = primary();
        return functions[name.value](value, state.angleMode);
      }

      throw new Error("Expected a number or function.");
    }

    function unary() {
      if (accept("+")) return unary();
      if (accept("-")) return -unary();
      return postfix();
    }

    function postfix() {
      let value = primary();
      while (accept("!")) value = CalcFunctions.factorial(value);
      return value;
    }

    function power() {
      let left = unary();
      if (accept("^")) {
        const right = power();
        left = Math.pow(left, right);
      }
      return left;
    }

    function multiply() {
      let value = power();
      while (peek("*") || peek("/")) {
        const operator = tokens[pos++].type;
        const right = power();
        if (operator === "/" && right === 0) throw new Error("Cannot divide by zero.");
        value = operator === "*" ? value * right : value / right;
      }
      return value;
    }

    function addSub() {
      let value = multiply();
      while (peek("+") || peek("-")) {
        const operator = tokens[pos++].type;
        const right = multiply();
        value = operator === "+" ? value + right : value - right;
      }
      return value;
    }

    const answer = addSub();
    if (pos !== tokens.length) throw new Error("Invalid expression.");
    if (!Number.isFinite(answer)) throw new Error("Result is outside the supported range.");
    return answer;
  }

  function render() {
    expressionEl.textContent = state.expression || "";
    resultEl.textContent = state.expression ? resultPreview() : format(state.lastResult);
    angleEl.textContent = state.angleMode;
    memoryEl.classList.toggle("hidden", state.memory === 0);
  }

  function resultPreview() {
    try {
      return format(evaluate(state.expression));
    } catch {
      return "…";
    }
  }

  function showError(message) {
    errorEl.textContent = message;
    window.clearTimeout(showError.timer);
    showError.timer = window.setTimeout(() => { errorEl.textContent = ""; }, 2500);
  }

  function insert(value) {
    if (state.justEvaluated && /[0-9.(]/.test(value)) state.expression = "";
    state.justEvaluated = false;
    state.expression += value;
    render();
  }

  function calculate() {
    if (!state.expression) return;
    try {
      const original = state.expression;
      const value = evaluate(original);
      state.lastResult = value;
      state.expression = "";
      state.justEvaluated = true;
      CalcHistory.add(original, format(value));
      errorEl.textContent = "";
      render();
    } catch (error) {
      showError(error.message);
    }
  }

  function functionAction(action) {
    try {
      if (action === "sin" || action === "cos" || action === "tan" ||
          action === "asin" || action === "acos" || action === "atan" ||
          action === "log" || action === "ln" || action === "sqrt") {
        insert(`${action}(`);
      } else if (action === "square") {
        insert("^2");
      } else if (action === "reciprocal") {
        if (!state.expression) state.expression = "1/(" + state.lastResult + ")";
        else state.expression = "1/(" + state.expression + ")";
        render();
      } else if (action === "percent") {
        insert("/100");
      } else if (action === "negate") {
        if (state.expression) state.expression = "-(" + state.expression + ")";
        else state.expression = "-";
        render();
      } else if (action === "pi") insert("π");
      else if (action === "e") insert("e");
      else if (action === "ans") insert("ans");
    } catch (error) {
      showError(error.message);
    }
  }

  function memoryAction(action) {
    try {
      if (action === "memory-clear") state.memory = 0;
      if (action === "memory-recall") insert(String(state.memory));
      if (action === "memory-add") state.memory += evaluate(state.expression || String(state.lastResult));
      if (action === "memory-subtract") state.memory -= evaluate(state.expression || String(state.lastResult));
      if (!Number.isFinite(state.memory)) state.memory = 0;
      render();
    } catch (error) {
      showError(error.message);
    }
  }

  keypad.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.insert !== undefined) insert(button.dataset.insert);
    if (button.dataset.action === "equals") calculate();
    if (button.dataset.action === "clear") {
      state.expression = "";
      state.justEvaluated = false;
      errorEl.textContent = "";
      render();
    }
    if (button.dataset.action === "backspace") {
      state.expression = state.expression.slice(0, -1);
      render();
    }
    if (button.dataset.action?.startsWith("memory-")) memoryAction(button.dataset.action);
    if (["sin","cos","tan","asin","acos","atan","log","ln","sqrt","square","reciprocal","percent","negate","pi","e","ans"].includes(button.dataset.action)) {
      functionAction(button.dataset.action);
    }
  });

  $("angleBtn").addEventListener("click", () => {
    state.angleMode = state.angleMode === "DEG" ? "RAD" : "DEG";
    $("angleBtn").textContent = state.angleMode;
    render();
  });

  document.querySelectorAll(".mode-btn").forEach(button => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b === button));
      document.querySelectorAll(".scientific-only").forEach(el => {
        el.style.display = state.mode === "scientific" ? "" : "none";
      });
    });
  });

  $("clearHistoryBtn").addEventListener("click", () => CalcHistory.clear());

  $("copyBtn").addEventListener("click", async () => {
    const value = state.justEvaluated ? format(state.lastResult) : resultPreview();
    try {
      await navigator.clipboard.writeText(value);
      $("copyBtn").textContent = "Copied";
      setTimeout(() => $("copyBtn").textContent = "Copy", 1200);
    } catch {
      showError("Copy is unavailable in this browser.");
    }
  });

  $("themeBtn").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    $("themeBtn").textContent = dark ? "☾" : "☀";
  });

  window.addEventListener("history-select", event => {
    state.lastResult = Number(String(event.detail.result).replace(/,/g, ""));
    state.expression = "";
    state.justEvaluated = true;
    render();
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const active = document.activeElement;
    if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return;

    if (/^[0-9.]$/.test(event.key)) insert(event.key);
    else if ("+-*/^()".includes(event.key)) insert(event.key);
    else if (event.key === "Enter" || event.key === "=") calculate();
    else if (event.key === "Backspace") {
      state.expression = state.expression.slice(0, -1);
      render();
    } else if (event.key === "Escape") {
      state.expression = "";
      render();
    }
  });

  document.querySelectorAll(".scientific-only").forEach(el => {
    el.style.display = "";
  });

  render();
})();
