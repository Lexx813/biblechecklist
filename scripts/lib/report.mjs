function escape(cell) {
  return String(cell).replace(/\|/g, '\\|');
}

export function renderTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `|${headers.map(() => '---').join('|')}|`;
  if (rows.length === 0) return `${head}\n${sep}\n`;
  const body = rows.map((r) => `| ${r.map(escape).join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}\n`;
}

export function renderHeader(title, date = new Date()) {
  const yyyy = date.toISOString().slice(0, 10);
  return `# ${title}\n\n_Generated ${yyyy}_\n\n`;
}
