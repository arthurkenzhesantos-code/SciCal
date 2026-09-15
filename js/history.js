window.CalcHistory = (() => {
  const items = [];

  function add(expression, result) {
    items.unshift({ expression, result });
    if (items.length > 20) items.pop();
    render();
  }

  function clear() {
    items.length = 0;
    render();
  }

  function getAll() {
    return [...items];
  }

  function render() {
    const root = document.getElementById("history");
    const count = document.getElementById("historyCount");
    if (!root || !count) return;
    count.textContent = String(items.length);

    if (!items.length) {
      root.innerHTML = '<p class="empty-history">Your calculations will appear here.</p>';
      return;
    }

    root.innerHTML = items.map((item, index) => `
      <button class="history-item" type="button" data-history-index="${index}">
        <span class="hist-expression">${escapeHtml(item.expression)}</span>
        <span class="hist-result">= ${escapeHtml(item.result)}</span>
      </button>
    `).join("");

    root.querySelectorAll("[data-history-index]").forEach(button => {
      button.addEventListener("click", () => {
        const item = items[Number(button.dataset.historyIndex)];
        if (item) window.dispatchEvent(new CustomEvent("history-select", { detail: item }));
      });
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  return { add, clear, getAll };
})();
