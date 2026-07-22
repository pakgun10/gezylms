window.GezyLMS = (() => {
  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const api = async (url, options = {}) => {
    const headers = options.body
      ? { "Content-Type": "application/json", ...(options.headers || {}) }
      : options.headers || {};
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const message = data?.error || data || `HTTP ${res.status}`;
      throw Object.assign(new Error(message), { status: res.status, data });
    }
    return data;
  };

  const renderInline = (text) =>
    escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const renderMarkdown = (markdown = "") => {
    const lines = String(markdown).replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let inList = false;
    let inCode = false;
    let code = [];

    const closeList = () => {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        if (inCode) {
          out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
          code = [];
          inCode = false;
        } else {
          closeList();
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        code.push(line);
        continue;
      }

      if (!line.trim()) {
        closeList();
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        closeList();
        const level = heading[1].length;
        out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
        continue;
      }

      const item = line.match(/^\s*[-*]\s+(.+)$/);
      if (item) {
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push(`<li>${renderInline(item[1])}</li>`);
        continue;
      }

      closeList();
      out.push(`<p>${renderInline(line)}</p>`);
    }

    closeList();
    if (inCode) out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    return out.join("\n");
  };

  const showError = (target, error) => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (error?.status === 401) {
      el.innerHTML = '<div class="notice error">Silakan <a href="/login">login</a> terlebih dahulu.</div>';
      return;
    }
    el.innerHTML = `<div class="notice error">${escapeHtml(error?.message || "Terjadi kesalahan")}</div>`;
  };

  const runMath = () => {
    if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
  };

  const toggleNav = () => {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
      navLinks.classList.toggle("active");
    }
  };

  return { api, escapeHtml, renderMarkdown, showError, runMath, toggleNav };
})();
