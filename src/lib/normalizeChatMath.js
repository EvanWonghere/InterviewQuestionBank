/**
 * Convert model-common LaTeX wrappers into remark-math / KaTeX forms.
 * Fenced code stays intact so C++ and mermaid sources are not rewritten.
 * @param {string} text
 */
export function normalizeChatMath(text) {
  if (!text) return '';
  let i = 0;
  let out = '';
  while (i < text.length) {
    const start = text.indexOf('```', i);
    if (start === -1) {
      out += rewriteOutsideFences(text.slice(i));
      break;
    }
    out += rewriteOutsideFences(text.slice(i, start));
    const infoEnd = text.indexOf('\n', start + 3);
    if (infoEnd === -1) {
      out += text.slice(start);
      break;
    }
    const info = text.slice(start + 3, infoEnd).trim().toLowerCase();
    const close = findFenceClose(text, infoEnd + 1);
    if (close === -1) {
      out += text.slice(start);
      break;
    }
    const lang = info === 'latex' || info === 'tex' ? 'math' : text.slice(start + 3, infoEnd).trim();
    const body = text.slice(infoEnd + 1, close);
    out += `\`\`\`${lang}\n${body}\`\`\``;
    i = close + 3;
    if (text[i] === '\n') {
      out += '\n';
      i += 1;
    }
  }
  return out;
}

function findFenceClose(text, from) {
  let index = from;
  while (index < text.length) {
    const at = text.indexOf('```', index);
    if (at === -1) return -1;
    const lineStart = text.lastIndexOf('\n', at - 1) + 1;
    const indent = text.slice(lineStart, at);
    if (/^ {0,3}$/.test(indent)) return at;
    index = at + 3;
  }
  return -1;
}

function rewriteOutsideFences(chunk) {
  return chunk
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => `$$\n${String(body).trim()}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, body) => `$${String(body).trim()}$`);
}
