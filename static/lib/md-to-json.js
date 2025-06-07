'use strict';

const unified = require('unified');
const markdown = require('remark-parse');

module.exports = function markdownToJson(markdownText) {
  const tree = unified().use(markdown).parse(markdownText);
  const blocks = [];

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
            items: node.children.map(li =>
              li.children.map(p => p.children.map(c => c.value || '').join('')).join('')
            )
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
        blocks.push({
          type: 'paragraph',
          data: {
            text: `[unsupported block type: ${node.type}]`
          }
        });
        break;
    }
  }

  return {
    time: Date.now(),
    version: '2.29.0',
    blocks
  };
};
