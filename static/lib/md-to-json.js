'use strict';

const unified = require('unified');
const markdown = require('remark-parse');

/**
 * Convert markdown content to Editor.js JSON format (server-side conversion).
 * 
 * This handles the complex MD→JSON conversion using AST parsing because:
 * - Markdown parsing requires specialized libraries (unified + remark-parse)
 * - Server already has these dependencies available
 * - Client would need heavy libraries for proper AST parsing
 * 
 * Used by filter:composer.get hook when loading existing content for editing.
 * 
 * @param {string} markdownText - Raw markdown content from NodeBB storage
 * @returns {Object} Editor.js compatible JSON structure
 */
module.exports = function markdownToJson(markdownText) {
  // Parse markdown into Abstract Syntax Tree (AST)
  const tree = unified().use(markdown).parse(markdownText);
  const blocks = [];

  // Convert each AST node to Editor.js block format
  for (const node of tree.children) {
    switch (node.type) {
      case 'heading':
        blocks.push({
          type: 'header',
          data: {
            text: node.children.map(child => child.value || '').join(''),
            level: node.depth
          }
        });
        break;
      case 'paragraph':
        blocks.push({
          type: 'paragraph',
          data: {
            text: node.children.map(child => child.value || '').join('')
          }
        });
        break;
      case 'list':
        blocks.push({
          type: 'list',
          data: {
            style: node.ordered ? 'ordered' : 'unordered',
            items: node.children.map(li => ({
              content: li.children.map(p => p.children.map(c => c.value || '').join('')).join(''),
              meta: {},
              items: [] // List 2.0 format - no nested items from markdown for now
            }))
          }
        });
        break;
      case 'code':
        blocks.push({
          type: 'code',
          data: {
            code: node.value
          }
        });
        break;
      case 'blockquote':
        blocks.push({
          type: 'quote',
          data: {
            text: node.children.map(p => p.children.map(c => c.value || '').join('')).join('\n')
          }
        });
        break;
      case 'thematicBreak':
        blocks.push({
          type: 'delimiter',
          data: {}
        });
        break;
      default:
        // Handle unknown markdown elements gracefully
        blocks.push({
          type: 'paragraph',
          data: {
            text: `[unsupported block type: ${node.type}]`
          }
        });
        break;
    }
  }

  // Return Editor.js compatible structure
  return {
    time: Date.now(),
    version: '2.29.0',
    blocks
  };
};
