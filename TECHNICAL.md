# Technical Documentation: NodeBB Editor.js Plugin

## Architecture Overview

This plugin enhances NodeBB's composer by replacing the default textarea with a modern block-style editor while maintaining full compatibility with NodeBB's existing systems.

```
.
├── index.js
├── LICENSE
├── package.json
├── plugin.json
├── README.md
├── static
│   └── lib
│       ├── editor.css
│       ├── editor.js
│       ├── json-to-md.js
│       └── md-to-json.js
└── TECHNICAL.md
```

## Core Components

### 1. Plugin Configuration (`plugin.json`)
```json
{
  "library": "./index.js",
  "hooks": [
    { "hook": "filter:composer.format", "method": "format" },
    { "hook": "filter:composer.get", "method": "get" }
  ],
  "staticDirs": { "static": "./static" },
  "scripts": ["./static/lib/editor.js"],
  "css": ["./static/lib/editor.css"],
  "templates": "./static/templates"
}
```

### 2. Server-Side Logic (`index.js`)

#### Data Flow Hooks
- **`filter:composer.format`**: Converts Editor.js JSON → Markdown for storage
- **`filter:composer.get`**: Converts Markdown → Editor.js JSON for editing

#### Conversion Libraries
- **`static/lib/json-to-md.js`**: Server-side JSON to Markdown converter
- **`static/lib/md-to-json.js`**: Server-side Markdown to JSON converter (uses `unified` + `remark-parse`)

### 3. Client-Side Integration (`static/lib/editor.js`)

#### Initialization Sequence
1. Listen for `action:composer.loaded` event
2. Dynamically load Editor.js CDN scripts
3. Find composer textarea and inject Editor.js container
4. Hide original textarea after Editor.js initializes
5. Set up bidirectional data synchronization

#### Key Functions
- **`loadEditorJSScripts()`**: Dynamic CDN loading with error handling
- **`convertEditorJsToMarkdown()`**: Client-side conversion for real-time sync
- **Form submission handler**: Ensures content is converted before validation

## Critical Technical Details

### 1. Dual Composer System
**Challenge**: NodeBB expects composer modules that this plugin doesn't provide.

**Solution**: The plugin works *alongside* `nodebb-plugin-composer-default`, not as a replacement. This ensures compatibility with other plugins and core NodeBB functionality.

**Key Point**: Both plugins must be active simultaneously.

### 2. Data Synchronization Strategy

The plugin maintains data in two formats:

```javascript
// Editor.js native format (stored in hidden input)
{
  "time": 1640995200000,
  "blocks": [
    {
      "type": "paragraph",
      "data": { "text": "Hello world" }
    }
  ],
  "version": "2.26.5"
}

// Markdown format (in original textarea for NodeBB)
"Hello world\n"
```

**Synchronization Points**:
- `onChange`: Real-time conversion during editing
- `onSubmit`: Final conversion before form submission
- `onLoad`: Convert existing markdown to Editor.js format

### 3. Script Loading Strategy

**Challenge**: Editor.js and its tools must load before initialization.

**Solution**: Dynamic script loading with Promise-based sequencing and pinned versions:

```javascript
// Version pinned on 2025-06-07 for stability (was using @latest)
const scripts = [
  'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.8',
  'https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.8',
  'https://cdn.jsdelivr.net/npm/@editorjs/list@2.0.8'
];
```

**Version Strategy**: Specific versions are pinned to avoid breaking changes from `@latest`. Update manually after testing compatibility.

**Fallback**: If CDN loading fails, gracefully fall back to default composer.

### 4. Validation Integration

**Challenge**: NodeBB validates content length using the textarea value.

**Solution**: Dual-write strategy ensures both formats are available:
- Editor.js JSON in hidden input (for editing)
- Converted markdown in textarea (for validation)

## Tricky Implementation Details

### 1. Event Timing Issues
**Problem**: NodeBB's composer events fire at different times than Editor.js lifecycle.

**Solution**: Multiple sync points with error handling:
```javascript
// Real-time sync
onChange: async () => { /* convert and store */ }

// Pre-submission sync  
form.on('submit', async () => { /* ensure conversion */ })
```

### 2. Mobile Responsiveness
**Problem**: NodeBB's default composer CSS can hide buttons on mobile.

**Challenge**: Competing CSS specificity from themes and core.

**Solution**: Aggressive CSS with `!important` declarations and multiple selectors.

### 3. Block Type Conversion Complexity

**Markdown → Editor.js**: Uses AST parsing via `remark-parse`
```javascript
const tree = unified().use(markdown).parse(markdownText);
// Convert AST nodes to Editor.js blocks
```

**Editor.js → Markdown**: Direct object mapping
```javascript
switch (block.type) {
  case 'header': return `${'#'.repeat(data.level)} ${data.text}\n`;
  case 'paragraph': return `${data.text}\n`;
  // ...
}
```

### 4. CDN Reliability & Version Management

**Problem**: CDN URLs can become outdated or unavailable, and `@latest` versions can introduce breaking changes.

**Current Solution**: Pin to specific stable versions (implemented 2025-06-07):
- `@editorjs/editorjs@2.30.8`
- `@editorjs/header@2.8.8`
- `@editorjs/list@2.0.8`

**Benefits**: Predictable behavior, no surprise breaking changes, easier debugging.

**Maintenance**: Check for updates periodically, test compatibility, and update versions manually.

## Potential Issues & Maintenance

### 1. Editor.js Version Compatibility
- **Current Versions** (pinned 2025-06-07): EditorJS 2.30.8, Header 2.8.8, List 2.0.8
- **Monitor**: Editor.js and tool plugin updates on npm
- **Test**: Block conversion after Editor.js updates
- **Update Process**: Manual version updates after compatibility testing
- **Consider**: Self-hosting scripts for even greater stability

### 2. NodeBB Core Changes
- **Watch**: Changes to composer architecture in NodeBB updates
- **Test**: Plugin compatibility with new NodeBB versions
- **Update**: Hook implementations if core APIs change

### 3. Mobile/Theme Compatibility
- **Challenge**: Different themes may require CSS adjustments
- **Solution**: Provide theme-specific CSS overrides or more targeted selectors

### 4. Performance Considerations
- **CDN Loading**: Can add ~500ms to composer load time
- **Bundle Size**: Editor.js + tools = ~200KB additional JavaScript
- **Optimization**: Consider bundling frequently-used tools

## Extension Points

### Adding New Block Types
1. Add CDN URL to script loading array
2. Include in Editor.js tools configuration
3. Update both conversion functions (client and server)
4. Test round-trip conversion (Editor.js ↔ Markdown)

### Custom Styling
1. Extend `static/lib/editor.css`
2. Use CSS custom properties for theming
3. Ensure mobile responsiveness is maintained

### Advanced Features
- **Draft Management**: Integrate with NodeBB's draft system
- **Image Upload**: Add Editor.js image tool with NodeBB file handling
- **Collaborative Editing**: Integrate operational transforms
- **Custom Blocks**: Create NodeBB-specific block types

## Testing Strategy

### Manual Testing Checklist
1. **Basic Functionality**: Create/edit posts with various block types
2. **Conversion Accuracy**: Verify markdown ↔ JSON conversion fidelity  
3. **Mobile Responsiveness**: Test on various screen sizes
4. **Error Handling**: Test with CDN failures, JavaScript disabled
5. **Integration**: Verify compatibility with other plugins

### Automated Testing Considerations
- Unit tests for conversion functions
- Integration tests for NodeBB hook behavior
- End-to-end tests for composer workflow
- Cross-browser compatibility testing

## Security Considerations

### XSS Prevention
- Editor.js provides built-in XSS protection
- Markdown conversion should sanitize output
- Trust NodeBB's existing content sanitization

### Content Validation
- Ensure converted markdown passes NodeBB's validation rules
- Validate Editor.js JSON structure before processing
- Handle malformed data gracefully

## Performance Monitoring

### Metrics to Track
- Editor initialization time
- CDN script loading success rate
- Conversion function performance
- Mobile user experience metrics

### Optimization Opportunities
- Lazy load non-essential Editor.js tools
- Cache converted content to reduce CPU usage
- Optimize CSS delivery and specificity