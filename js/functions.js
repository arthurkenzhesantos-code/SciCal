window.CalcFunctions = {
  factorial(n) {
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n) || n > 170) {
      throw new Error("Factorial requires an integer from 0 to 170.");
    }
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  },

  toRadians(value) {
    return value * Math.PI / 180;
  },

  fromAngle(value, mode) {
    return mode === "DEG" ? this.toRadians(value) : value;
  },

  sin(value, mode) {
    return Math.sin(this.fromAngle(value, mode));
  },

  cos(value, mode) {
    return Math.cos(this.fromAngle(value, mode));
  },

  tan(value, mode) {
    const radians = this.fromAngle(value, mode);
    if (Math.abs(Math.cos(radians)) < 1e-12) throw new Error("Tangent is undefined here.");
    return Math.tan(radians);
  },

  asin(value, mode) {
    if (value < -1 || value > 1) throw new Error("asin domain is −1 to 1.");
    const answer = Math.asin(value);
    return mode === "DEG" ? answer * 180 / Math.PI : answer;
  },

  acos(value, mode) {
    if (value < -1 || value > 1) throw new Error("acos domain is −1 to 1.");
    const answer = Math.acos(value);
    return mode === "DEG" ? answer * 180 / Math.PI : answer;
  },

  atan(value, mode) {
    const answer = Math.atan(value);
    return mode === "DEG" ? answer * 180 / Math.PI : answer;
  },

  log(value) {
    if (value <= 0) throw new Error("log requires a positive number.");
    return Math.log10(value);
  },

  ln(value) {
    if (value <= 0) throw new Error("ln requires a positive number.");
    return Math.log(value);
  },

  sqrt(value) {
    if (value < 0) throw new Error("Square root requires a non-negative number.");
    return Math.sqrt(value);
  }
};
