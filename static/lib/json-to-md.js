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
        return convertListToMarkdown(data, 0);
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

// Helper function to convert List 2.0 format to markdown
function convertListToMarkdown(listData, depth = 0) {
  if (!listData.items || !Array.isArray(listData.items)) return '';
  
  const indent = '  '.repeat(depth); // 2 spaces per nesting level
  let result = '';
  
  listData.items.forEach((item, index) => {
    let bullet;
    
    // Handle different list styles
    if (listData.style === 'ordered') {
      bullet = `${index + 1}.`;
    } else if (listData.style === 'checklist') {
      // Check if item is checked (meta.checked)
      const isChecked = item.meta && item.meta.checked;
      bullet = isChecked ? '- [x]' : '- [ ]';
    } else {
      // Default to unordered
      bullet = '-';
    }
    
    // Add the list item content
    const content = item.content || '';
    result += `${indent}${bullet} ${content}\n`;
    
    // Handle nested items (List 2.0 supports nesting)
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      const nestedListData = {
        style: listData.style,
        items: item.items
      };
      result += convertListToMarkdown(nestedListData, depth + 1);
    }
  });
  
  return result;
}
