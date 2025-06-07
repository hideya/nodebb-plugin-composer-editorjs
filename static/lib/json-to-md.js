'use strict';

/**
 * Enhanced JSON to Markdown converter for Editor.js data
 * Handles various block types with proper formatting
 */

function escapeMarkdown(text) {
  if (typeof text !== 'string') return '';
  
  // Escape special markdown characters but preserve intentional formatting
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

function processInlineFormatting(text) {
  if (typeof text !== 'string') return '';
  
  // Handle basic HTML tags that might come from Editor.js
  return text
    .replace(/<b>/g, '**')
    .replace(/<\/b>/g, '**')
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<i>/g, '*')
    .replace(/<\/i>/g, '*')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<code>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<br\s*\/?>/g, '\n')
    // Remove other HTML tags
    .replace(/<[^>]*>/g, '');
}

function convertListItems(items, style, indentLevel = 0) {
  if (!Array.isArray(items)) return '';
  
  const indent = '  '.repeat(indentLevel);
  
  return items.map((item, index) => {
    if (typeof item === 'object' && item.content && Array.isArray(item.items)) {
      // Nested list
      const content = processInlineFormatting(item.content);
      const bullet = style === 'ordered' ? `${index + 1}.` : '-';
      const nestedItems = convertListItems(item.items, item.style || style, indentLevel + 1);
      return `${indent}${bullet} ${content}\n${nestedItems}`;
    } else {
      // Regular list item
      const content = processInlineFormatting(typeof item === 'string' ? item : (item.content || ''));
      const bullet = style === 'ordered' ? `${index + 1}.` : '-';
      return `${indent}${bullet} ${content}`;
    }
  }).join('\n');
}

module.exports = function jsonToMarkdown(data) {
  if (!data || typeof data !== 'object') return '';
  
  // Handle both direct blocks array and wrapped data
  const blocks = Array.isArray(data) ? data : (data.blocks || []);
  
  if (!Array.isArray(blocks)) return '';

  const result = blocks.map(block => {
    if (!block || typeof block !== 'object') return '';
    
    const { type, data } = block;
    
    if (!data || typeof data !== 'object') return '';
    
    switch (type) {
      case 'paragraph':
        const text = processInlineFormatting(data.text || '');
        return text ? `${text}\n` : '';
        
      case 'header':
        const headerText = processInlineFormatting(data.text || '');
        const level = Math.max(1, Math.min(6, parseInt(data.level) || 1));
        return headerText ? `${'#'.repeat(level)} ${headerText}\n` : '';
        
      case 'list':
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) return '';
        const listContent = convertListItems(data.items, data.style || 'unordered');
        return listContent ? `${listContent}\n` : '';
        
      case 'code':
        const code = data.code || '';
        const language = data.language || '';
        return code ? `\`\`\`${language}\n${code}\n\`\`\`\n` : '';
        
      case 'quote':
        const quoteText = processInlineFormatting(data.text || '');
        const caption = data.caption ? processInlineFormatting(data.caption) : '';
        let result = quoteText ? `> ${quoteText}\n` : '';
        if (caption) {
          result += `>\n> — ${caption}\n`;
        }
        return result;
        
      case 'delimiter':
        return '---\n';
        
      case 'table':
        if (!data.content || !Array.isArray(data.content)) return '';
        
        const tableRows = data.content.map(row => {
          if (!Array.isArray(row)) return '';
          return '| ' + row.map(cell => processInlineFormatting(cell || '')).join(' | ') + ' |';
        }).filter(Boolean);
        
        if (tableRows.length === 0) return '';
        
        // Add header separator for markdown table
        if (tableRows.length > 0) {
          const headerSep = '| ' + data.content[0].map(() => '---').join(' | ') + ' |';
          tableRows.splice(1, 0, headerSep);
        }
        
        return tableRows.join('\n') + '\n';
        
      case 'checklist':
        if (!data.items || !Array.isArray(data.items)) return '';
        return data.items.map(item => {
          const checked = item.checked ? 'x' : ' ';
          const text = processInlineFormatting(item.text || '');
          return text ? `- [${checked}] ${text}` : '';
        }).filter(Boolean).join('\n') + '\n';
        
      case 'warning':
        const warningText = processInlineFormatting(data.message || '');
        const warningTitle = processInlineFormatting(data.title || 'Warning');
        return warningText ? `> ⚠️ **${warningTitle}**\n> \n> ${warningText}\n` : '';
        
      case 'image':
        const url = data.file?.url || data.url || '';
        const caption = processInlineFormatting(data.caption || '');
        const alt = processInlineFormatting(data.alt || caption || 'Image');
        
        if (!url) return '';
        
        let imageMarkdown = `![${alt}](${url})`;
        if (caption && caption !== alt) {
          imageMarkdown += `\n\n*${caption}*`;
        }
        return imageMarkdown + '\n';
        
      case 'embed':
        const embedUrl = data.source || '';
        const embedCaption = processInlineFormatting(data.caption || '');
        
        if (!embedUrl) return '';
        
        let embedMarkdown = `[Embedded content](${embedUrl})`;
        if (embedCaption) {
          embedMarkdown += `\n\n*${embedCaption}*`;
        }
        return embedMarkdown + '\n';
        
      case 'linkTool':
        const linkUrl = data.link || '';
        const linkTitle = processInlineFormatting(data.meta?.title || data.title || linkUrl);
        const linkDesc = processInlineFormatting(data.meta?.description || data.description || '');
        
        if (!linkUrl) return '';
        
        let linkMarkdown = `[${linkTitle}](${linkUrl})`;
        if (linkDesc) {
          linkMarkdown += `\n\n${linkDesc}`;
        }
        return linkMarkdown + '\n';
        
      case 'raw':
        // Raw HTML block
        return (data.html || '') + '\n';
        
      default:
        // Try to extract text from unknown blocks
        const fallbackText = data.text || data.content || data.html || '';
        if (fallbackText) {
          return `<!-- Unknown block type: ${type} -->\n${processInlineFormatting(fallbackText)}\n`;
        }
        return `<!-- Unsupported block type: ${type} -->\n`;
    }
  }).filter(Boolean).join('\n');

  return result.trim() + (result.trim() ? '\n' : '');
};
