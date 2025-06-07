// Universal markdown converter that works in both Node.js and browser
// File: static/lib/universal-md-converter.js

(function(global) {
  'use strict';

  // Universal markdown to Editor.js converter
  function markdownToEditorJs(markdownText) {
    // Check if we're in Node.js environment
    const isNode = typeof module !== 'undefined' && module.exports;
    
    if (isNode) {
      // Node.js version - use require
      const unified = require('unified');
      const markdown = require('remark-parse');
      return parseMarkdownWithUnified(markdownText, unified, markdown);
    } else {
      // Browser version - use global variables loaded from CDN
      if (typeof unified === 'undefined' || typeof remarkParse === 'undefined') {
        console.warn('Unified/remark not available, falling back to simple parser');
        return parseMarkdownSimple(markdownText);
      }
      return parseMarkdownWithUnified(markdownText, unified, remarkParse);
    }
  }

  // Main parsing function using unified/remark
  function parseMarkdownWithUnified(markdownText, unified, remarkParse) {
    const tree = unified().use(remarkParse).parse(markdownText);
    const blocks = [];

    for (const node of tree.children) {
      switch (node.type) {
        case 'heading':
          blocks.push({
            type: 'header',
            data: {
              text: extractTextFromNode(node),
              level: node.depth
            }
          });
          break;
          
        case 'paragraph':
          const text = extractTextFromNode(node);
          if (text.trim()) {  // Skip empty paragraphs
            blocks.push({
              type: 'paragraph',
              data: { text }
            });
          }
          break;
          
        case 'list':
          blocks.push({
            type: 'list',
            data: {
              style: node.ordered ? 'ordered' : 'unordered',
              items: node.children.map(li => ({
                content: extractTextFromNode(li),
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
              code: node.value || ''
            }
          });
          break;
          
        case 'blockquote':
          blocks.push({
            type: 'quote',
            data: {
              text: extractTextFromNode(node)
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
          // Skip unknown node types or convert to paragraph if they have text
          const unknownText = extractTextFromNode(node);
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

    return {
      time: Date.now(),
      version: '2.29.0',
      blocks
    };
  }

  // Fallback simple parser for when unified/remark isn't available
  function parseMarkdownSimple(markdownText) {
    const lines = markdownText.split('\n');
    const blocks = [];
    let currentBlock = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }
      
      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({
          type: 'header',
          data: {
            text: headerMatch[2],
            level: headerMatch[1].length
          }
        });
        currentBlock = null;
        continue;
      }
      
      // List items
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
      if (listMatch) {
        if (currentBlock && currentBlock.type !== 'list') {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        
        if (!currentBlock) {
          currentBlock = {
            type: 'list',
            data: {
              style: /\d+\./.test(listMatch[2]) ? 'ordered' : 'unordered',
              items: []
            }
          };
        }
        
        currentBlock.data.items.push({
          content: listMatch[3],
          meta: {},
          items: []
        });
        continue;
      }
      
      // Blockquote
      if (line.startsWith('> ')) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({
          type: 'quote',
          data: {
            text: line.substring(2)
          }
        });
        currentBlock = null;
        continue;
      }
      
      // Code block
      if (line.startsWith('```')) {
        if (currentBlock) blocks.push(currentBlock);
        
        // Find the closing ```
        const codeLines = [];
        i++; // Skip opening ```
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        blocks.push({
          type: 'code',
          data: {
            code: codeLines.join('\n')
          }
        });
        currentBlock = null;
        continue;
      }
      
      // Horizontal rule
      if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({
          type: 'delimiter',
          data: {}
        });
        currentBlock = null;
        continue;
      }
      
      // Regular paragraph
      if (!currentBlock || currentBlock.type !== 'paragraph') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          type: 'paragraph',
          data: { text: line }
        };
      } else {
        // Continue current paragraph
        currentBlock.data.text += '\n' + line;
      }
    }
    
    // Add final block
    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return {
      time: Date.now(),
      version: '2.29.0',
      blocks
    };
  }

  // Helper function to extract text from AST nodes
  function extractTextFromNode(node) {
    if (node.value) return node.value;
    if (!node.children) return '';
    
    return node.children.map(child => {
      if (child.value) return child.value;
      if (child.children) return extractTextFromNode(child);
      return '';
    }).join('');
  }

  // Export for both Node.js and browser
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = markdownToEditorJs;
  } else {
    // Browser
    global.markdownToEditorJs = markdownToEditorJs;
  }

})(typeof window !== 'undefined' ? window : global);
