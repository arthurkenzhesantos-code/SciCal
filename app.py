import os
from flask import Flask, request, jsonify, send_from_directory
import ast
import math
import operator

app = Flask(__name__, static_folder=".", static_url_path="")

# Safe arithmetic evaluator for the calculator API.
_ALLOWED_BINOPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
}
_ALLOWED_UNARYOPS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}
_ALLOWED_FUNCS = {
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "asin": math.asin, "acos": math.acos, "atan": math.atan,
    "sqrt": math.sqrt, "log": math.log, "log10": math.log10,
    "exp": math.exp, "floor": math.floor, "ceil": math.ceil,
    "fabs": math.fabs,
}
_ALLOWED_NAMES = {"pi": math.pi, "e": math.e, "tau": math.tau}

def _eval(node):
    if isinstance(node, ast.Expression):
        return _eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_BINOPS:
        return _ALLOWED_BINOPS[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED_UNARYOPS:
        return _ALLOWED_UNARYOPS[type(node.op)](_eval(node.operand))
    if isinstance(node, ast.Name) and node.id in _ALLOWED_NAMES:
        return _ALLOWED_NAMES[node.id]
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        fn = _ALLOWED_FUNCS.get(node.func.id)
        if fn and all(isinstance(a, (ast.Constant, ast.BinOp, ast.UnaryOp, ast.Name, ast.Call)) for a in node.args):
            return fn(*[_eval(a) for a in node.args])
    raise ValueError("Unsupported expression")

@app.get("/")
def index():
    return send_from_directory(".", "index.html")

@app.post("/api/calculate")
def calculate():
    data = request.get_json(silent=True) or {}
    expression = str(data.get("expression", "")).strip()
    if not expression:
        return jsonify({"error": "Expression is required"}), 400
    try:
        value = _eval(ast.parse(expression, mode="eval"))
        if not math.isfinite(float(value)):
            raise ValueError("Result is not finite")
        return jsonify({"result": value})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "10000"))
    app.run(host="0.0.0.0", port=port)
