'use strict';

const plugin = module.exports;

// Note: Removed plugin.format hook - client-side conversion handles JSON→Markdown
// The textarea already contains the converted markdown, so server-side reconversion
// was redundant and could cause inconsistencies.
//
// ASYMMETRIC CONVERSION ARCHITECTURE:
// - JSON→MD: Client-side (simple object mapping, no libraries needed)
// - MD→JSON: Server-side (complex AST parsing, requires unified/remark-parse)
//
// This approach minimizes client dependencies while leveraging server capabilities.

/**
 * Convert existing markdown content to Editor.js JSON format for editing.
 * 
 * This server-side conversion is necessary because:
 * 1. NodeBB stores content as markdown in the database
 * 2. Editor.js needs JSON format to render blocks
 * 3. Complex markdown parsing requires AST libraries (unified/remark-parse)
 * 4. Client doesn't have these heavy parsing libraries loaded
 * 
 * Flow: Server storage (MD) → Server conversion (MD→JSON) → Client rendering (JSON)
 */
plugin.get = async (data) => {
  // Only convert if we have markdown content but no JSON version yet
  if (data.post.content && !data.post.editorjsData) {
    const parser = require('./static/lib/md-to-json');
    data.post.editorjsData = JSON.stringify(parser(data.post.content));
  }
  return data;
};



