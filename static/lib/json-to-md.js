'use strict';

module.exports = function jsonToMarkdown(data) {
  if (!data || !Array.isArray(data.blocks)) return '';

  return data.blocks.map(block => {
    const { type, data } = block;
    switch (type) {
      case 'paragraph':
        return `${data.text}\n`;
      case 'header':
        return `${'#'.repeat(data.level)} ${data.text}\n`;
      case 'list':
        return data.items.map((item, i) => {
          const bullet = data.style === 'ordered' ? `${i + 1}.` : '-';
          return `${bullet} ${item}`;
        }).join('\n') + '\n';
      case 'code':
        return `\`\`\`\n${data.code}\n\`\`\`\n`;
      case 'quote':
        return `> ${data.text}\n`;
      case 'delimiter':
        return `---\n`;
      default:
        return `<!-- unsupported: ${type} -->\n`;
    }
  }).join('\n');
};
