'use strict';

const unified = require('unified');
const markdown = require('remark-parse');

/**
 * Enhanced Markdown to JSON converter for Editor.js
 * Handles complex markdown structures and converts them to Editor.js blocks
 */

function processInlineText(children) {
  if (!Array.isArray(children)) return '';
  
  return children.map(child => {
    switch (child.type) {
      case 'text':
        return child.value || '';
      case 'strong':
        const strongText = processInlineText(child.children);
        return `<b>${strongText}</b>`;
      case 'emphasis':
        const emText = processInlineText(child.children);
        return `<i>${emText}</i>`;
      case 'inlineCode':
        return `<code>${child.value || ''}</code>`;
      case 'link':
        const linkText = processInlineText(child.children);
        return `<a href="${child.url || ''}">${linkText}</a>`;
      case 'break':
        return '<br>';
      default:
        return processInlineText(child.children || []);
    }
  }).join('');
}

function processListItems(children) {
  if (!Array.isArray(children)) return [];
  
  return children.map(listItem => {
    if (listItem.type !== 'listItem') return '';
    
    const content = listItem.children.map(child => {
      switch (child.type) {
        case 'paragraph':
          return processInlineText(child.children);
        case 'list':
          // Handle nested lists
          return {
            content: '',
            items: processListItems(child.children),
            style: child.ordered ? 'ordered' : 'unordered'
          };
        default:
          return processInlineText(child.children || []);
      }
    });
    
    // If it's a simple text item
    if (content.length === 1 && typeof content[0] === 'string') {
      return content[0];
    }
    
    // Handle complex items with nested content
    const textContent = content.filter(c => typeof c === 'string').join(' ');
    const nestedLists = content.filter(c => typeof c === 'object' && c.items);
    
    if (nestedLists.length > 0) {
      return {
        content: textContent,
        items: nestedLists[0].items,
        style: nestedLists[0].style
      };
    }
    
    return textContent;
  }).filter(item => item !== '');
}

function extractTableContent(node) {
  if (!node.children || !Array.isArray(node.children)) return [];
  
  return node.children.map(row => {
    if (row.type !== 'tableRow' || !Array.isArray(row.children)) return [];
    
    return row.children.map(cell => {
      if (cell.type !== 'tableCell' || !Array.isArray(cell.children)) return '';
      
      return cell.children.map(child => {
        if (child.type === 'paragraph') {
          return processInlineText(child.children);
        }
        return processInlineText(child.children || []);
      }).join(' ');
    });
  });
}

module.exports = function markdownToJson(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') {
    return {
      time: Date.now(),
      version: '2.28.2',
      blocks: []
    };
  }

  let tree;
  try {
    tree = unified().use(markdown).parse(markdownText);
  } catch (error) {
    console.error('Failed to parse markdown:', error);
    return {
      time: Date.now(),
      version: '2.28.2',
      blocks: [{
        type: 'paragraph',
        data: { text: markdownText }
      }]
    };
  }

  const blocks = [];

  for (const node of tree.children || []) {
    switch (node.type) {
      case 'heading':
        const headerText = processInlineText(node.children);
        if (headerText.trim()) {
          blocks.push({
            type: 'header',
            data: {
              text: headerText,
              level: Math.max(1, Math.min(6, node.depth || 1))
            }
          });
        }
        break;

      case 'paragraph':
        const paragraphText = processInlineText(node.children);
        if (paragraphText.trim()) {
          // Check if it's a checklist item
          const checklistMatch = paragraphText.match(/^- \[([ x])\] (.+)$/);
          if (checklistMatch) {
            blocks.push({
              type: 'checklist',
              data: {
                items: [{
                  text: checklistMatch[2],
                  checked: checklistMatch[1] === 'x'
                }]
              }
            });
          } else {
            blocks.push({
              type: 'paragraph',
              data: { text: paragraphText }
            });
          }
        }
        break;

      case 'list':
        const items = processListItems(node.children);
        if (items.length > 0) {
          blocks.push({
            type: 'list',
            data: {
              style: node.ordered ? 'ordered' : 'unordered',
              items: items
            }
          });
        }
        break;

      case 'code':
        blocks.push({
          type: 'code',
          data: {
            code: node.value || '',
            language: node.lang || ''
          }
        });
        break;

      case 'blockquote':
        const quoteContent = node.children.map(child => {
          if (child.type === 'paragraph') {
            return processInlineText(child.children);
          }
          return '';
        }).filter(Boolean).join('\n');
        
        if (quoteContent.trim()) {
          // Check for attribution (— Author format)
          const lines = quoteContent.split('\n');
          const lastLine = lines[lines.length - 1];
          const attributionMatch = lastLine.match(/^—\s*(.+)$/);
          
          if (attributionMatch && lines.length > 1) {
            blocks.push({
              type: 'quote',
              data: {
                text: lines.slice(0, -1).join('\n'),
                caption: attributionMatch[1]
              }
            });
          } else {
            blocks.push({
              type: 'quote',
              data: { text: quoteContent }
            });
          }
        }
        break;

      case 'thematicBreak':
        blocks.push({
          type: 'delimiter',
          data: {}
        });
        break;

      case 'table':
        const tableContent = extractTableContent(node);
        if (tableContent.length > 0) {
          blocks.push({
            type: 'table',
            data: {
              content: tableContent,
              withHeadings: true
            }
          });
        }
        break;

      case 'image':
        blocks.push({
          type: 'image',
          data: {
            url: node.url || '',
            caption: node.alt || '',
            alt: node.alt || ''
          }
        });
        break;

      case 'html':
        // Handle raw HTML
        const htmlContent = node.value || '';
        if (htmlContent.trim()) {
          // Try to detect if it's a comment with block type info
          const commentMatch = htmlContent.match(/<!--\s*(.*?)\s*-->/);
          if (commentMatch) {
            const comment = commentMatch[1];
            if (comment.startsWith('Unsupported block type:') || comment.startsWith('Unknown block type:')) {
              // Skip these comments
              break;
            }
          }
          
          blocks.push({
            type: 'raw',
            data: { html: htmlContent }
          });
        }
        break;

      default:
        // Handle unknown node types by converting to paragraph
        const unknownText = node.value || '';
        if (unknownText.trim()) {
          blocks.push({
            type: 'paragraph',
            data: {
              text: `[${node.type}] ${unknownText}`
            }
          });
        }
        break;
    }
  }

  // Post-process to merge consecutive checklist items
  const processedBlocks = [];
  let currentChecklist = null;

  for (const block of blocks) {
    if (block.type === 'checklist') {
      if (currentChecklist) {
        currentChecklist.data.items.push(...block.data.items);
      } else {
        currentChecklist = block;
        processedBlocks.push(currentChecklist);
      }
    } else {
      currentChecklist = null;
      processedBlocks.push(block);
    }
  }

  return {
    time: Date.now(),
    version: '2.28.2',
    blocks: processedBlocks
  };
};
