const { expect } = require('chai');
const jsonToMarkdown = require('../../static/lib/json-to-md');
const markdownToJson = require('../../static/lib/md-to-json');

describe('Editor.js Conversion Functions', () => {
  describe('JSON to Markdown Conversion', () => {
    it('should convert simple paragraph blocks', () => {
      const input = {
        blocks: [
          {
            type: 'paragraph',
            data: { text: 'Hello world' }
          }
        ]
      };
      
      const result = jsonToMarkdown(input);
      expect(result).to.equal('Hello world\n');
    });

    it('should convert header blocks with correct levels', () => {
      const input = {
        blocks: [
          {
            type: 'header',
            data: { text: 'Main Title', level: 1 }
          },
          {
            type: 'header',
            data: { text: 'Subtitle', level: 2 }
          }
        ]
      };
      
      const result = jsonToMarkdown(input);
      expect(result).to.equal('# Main Title\n\n## Subtitle\n');
    });

    it('should convert list blocks', () => {
      const input = {
        blocks: [
          {
            type: 'list',
            data: {
              style: 'unordered',
              items: ['First item', 'Second item']
            }
          }
        ]
      };
      
      const result = jsonToMarkdown(input);
      expect(result).to.equal('- First item\n- Second item\n');
    });

    it('should convert code blocks', () => {
      const input = {
        blocks: [
          {
            type: 'code',
            data: {
              code: 'console.log("Hello");',
              language: 'javascript'
            }
          }
        ]
      };
      
      const result = jsonToMarkdown(input);
      expect(result).to.equal('```javascript\nconsole.log("Hello");\n```\n');
    });

    it('should handle empty or invalid input gracefully', () => {
      expect(jsonToMarkdown(null)).to.equal('');
      expect(jsonToMarkdown({})).to.equal('');
      expect(jsonToMarkdown({ blocks: [] })).to.equal('');
    });
  });

  describe('Markdown to JSON Conversion', () => {
    it('should convert markdown paragraphs to paragraph blocks', () => {
      const input = 'Hello world';
      const result = markdownToJson(input);
      
      expect(result.blocks).to.have.lengthOf(1);
      expect(result.blocks[0].type).to.equal('paragraph');
      expect(result.blocks[0].data.text).to.equal('Hello world');
    });

    it('should convert markdown headers to header blocks', () => {
      const input = '# Main Title\n## Subtitle';
      const result = markdownToJson(input);
      
      expect(result.blocks).to.have.lengthOf(2);
      expect(result.blocks[0].type).to.equal('header');
      expect(result.blocks[0].data.level).to.equal(1);
      expect(result.blocks[0].data.text).to.equal('Main Title');
      expect(result.blocks[1].type).to.equal('header');
      expect(result.blocks[1].data.level).to.equal(2);
      expect(result.blocks[1].data.text).to.equal('Subtitle');
    });

    it('should convert markdown lists to list blocks', () => {
      const input = '- First item\n- Second item';
      const result = markdownToJson(input);
      
      expect(result.blocks).to.have.lengthOf(1);
      expect(result.blocks[0].type).to.equal('list');
      expect(result.blocks[0].data.style).to.equal('unordered');
      expect(result.blocks[0].data.items).to.deep.equal(['First item', 'Second item']);
    });

    it('should handle empty input gracefully', () => {
      const result = markdownToJson('');
      expect(result.blocks).to.have.lengthOf(0);
    });
  });

  describe('Round-trip Conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const originalData = {
        blocks: [
          {
            type: 'header',
            data: { text: 'Test Header', level: 2 }
          },
          {
            type: 'paragraph',
            data: { text: 'Test paragraph content' }
          },
          {
            type: 'list',
            data: {
              style: 'unordered',
              items: ['Item 1', 'Item 2']
            }
          }
        ]
      };

      const markdown = jsonToMarkdown(originalData);
      const convertedBack = markdownToJson(markdown);
      
      expect(convertedBack.blocks).to.have.lengthOf(3);
      expect(convertedBack.blocks[0].type).to.equal('header');
      expect(convertedBack.blocks[0].data.text).to.equal('Test Header');
      expect(convertedBack.blocks[1].type).to.equal('paragraph');
      expect(convertedBack.blocks[2].type).to.equal('list');
    });
  });
});
