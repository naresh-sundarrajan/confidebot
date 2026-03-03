export function syntaxHighlight(json) {
  if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
  return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, match => {
      let cls = 'json-string';
      if (match.endsWith(':')) {
        cls = 'json-key';
        return `<span class="${cls}">${match.replace(/"/g, '').slice(0, -1)}</span>:`;
      }
      return `<span class="${cls}">${match}</span>`;
    })
    .replace(/\b(true|false)\b/g, '<span class="json-bool">$1</span>')
    .replace(/\bnull\b/g, '<span class="json-null">null</span>')
    .replace(/\b(-?\d+\.?\d*([eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>');
}
