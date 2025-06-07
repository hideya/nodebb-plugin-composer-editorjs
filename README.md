# NodeBB Plugin: Composer Editor.js

A modern, block-style WYSIWYG editor for NodeBB that replaces the default markdown composer with [Editor.js](https://editorjs.io/), providing an intuitive and powerful content creation experience.

## ✨ Features

- **🎯 Modern Block-Style Editing**: Intuitive WYSIWYG editor with drag-and-drop block organization
- **🔄 Seamless Integration**: Works alongside NodeBB's default composer plugin for maximum compatibility
- **📝 Comprehensive Block Support**: Headers, paragraphs, lists, code blocks, quotes, delimiters, and more
- **📱 Mobile-First Design**: Fully responsive with optimized touch interactions
- **🌙 Dark Mode Support**: Automatic theme adaptation based on user preferences
- **⚡ Performance Optimized**: Smart script loading, caching, and minimal resource usage
- **🔧 Developer Friendly**: Comprehensive testing, linting, and development tools

## 🚀 Supported Block Types

| Block Type | Description | Markdown Output |
|------------|-------------|-----------------|
| **Paragraph** | Basic text blocks with inline formatting | Plain text |
| **Headers** | H1-H6 headings | `# Header` |
| **Lists** | Ordered and unordered lists with nesting | `- Item` or `1. Item` |
| **Code** | Syntax-highlighted code blocks | ` ```language` |
| **Quote** | Blockquotes with optional attribution | `> Quote text` |
| **Delimiter** | Horizontal rules for content separation | `---` |
| **Tables** | Structured data presentation | Markdown tables |
| **Checklists** | Interactive task lists | `- [ ] Task` |

## 📋 Requirements

- **NodeBB**: v3.0.0 or higher (tested with v4.x)
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Dependencies**: `nodebb-plugin-composer-default` must be active

## 📦 Installation

### Method 1: npm (Recommended)

```bash
cd /path/to/your/nodebb
npm install nodebb-plugin-composer-editorjs
```

### Method 2: Manual Installation

```bash
cd /path/to/your/nodebb/node_modules
git clone https://github.com/hideya/nodebb-plugin-composer-editorjs.git
cd nodebb-plugin-composer-editorjs
npm install
```

### Method 3: Development Installation

```bash
# Clone the repository
git clone https://github.com/hideya/nodebb-plugin-composer-editorjs.git
cd nodebb-plugin-composer-editorjs

# Install dependencies
npm install

# Link to your NodeBB installation
./dev.sh link /path/to/your/nodebb
```

## ⚙️ Setup

1. **Activate the Plugin**:
   - Go to **Admin Panel** → **Extend** → **Plugins**
   - Find "NodeBB Plugin: Composer Editor.js" and click **Activate**
   - ⚠️ **Important**: Ensure `nodebb-plugin-composer-default` is also activated

2. **Rebuild NodeBB**:
   ```bash
   ./nodebb build
   ./nodebb restart
   ```

3. **Verify Installation**:
   - Create a new topic or reply
   - The Editor.js interface should appear instead of the markdown textarea
   - Test different block types to ensure functionality

## 🔧 Configuration

The plugin works out of the box with sensible defaults. For advanced configuration:

### Environment Variables

```bash
# Enable debug logging
DEBUG=nodebb:plugin:composer-editorjs

# CDN Configuration (optional)
EDITORJS_CDN_BASE=https://your-cdn.com/editorjs
```

### Custom CSS Theming

Add to your theme's CSS:

```css
/* Customize editor container */
#editorjs-container {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Custom block styling */
#editorjs .ce-paragraph {
  font-size: 18px;
  line-height: 1.8;
}
```

## 🛠️ Development

### Development Setup

```bash
# Clone and setup
git clone https://github.com/hideya/nodebb-plugin-composer-editorjs.git
cd nodebb-plugin-composer-editorjs
npm install

# Development commands
./dev.sh install     # Install dependencies
./dev.sh lint        # Run ESLint
./dev.sh test        # Run tests
./dev.sh link DIR    # Link to NodeBB installation
```

### Adding Custom Block Types

1. **Add CDN URL** to the tools array in `static/lib/editor.js`:
   ```javascript
   const TOOLS = [
     // ... existing tools
     {
       name: 'YourTool',
       src: 'https://cdn.jsdelivr.net/npm/@editorjs/your-tool@1.0.0/dist/bundle.js',
       check: () => typeof YourTool !== 'undefined'
     }
   ];
   ```

2. **Configure the tool** in the Editor.js initialization:
   ```javascript
   tools: {
     // ... existing tools
     yourTool: YourTool
   }
   ```

3. **Update converters** in both `json-to-md.js` and `md-to-json.js`:
   ```javascript
   case 'yourTool':
     return `Your custom markdown output`;
   ```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Lint code
npm run lint
npm run lint:fix
```

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully Supported |
| Firefox | Latest | ✅ Fully Supported |
| Safari | Latest | ✅ Fully Supported |
| Edge | Latest | ✅ Fully Supported |
| iOS Safari | 12+ | ✅ Fully Supported |
| Chrome Mobile | Latest | ✅ Fully Supported |

## 🔍 Troubleshooting

### Editor Doesn't Appear

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify Plugin Status**: Both this plugin and `nodebb-plugin-composer-default` must be active
3. **Rebuild NodeBB**: Run `./nodebb build` and restart
4. **Clear Cache**: Clear browser cache and NodeBB cache

### Content Validation Errors

1. **Check Conversion**: Verify that Editor.js content converts to valid markdown
2. **Inspect Data**: Use browser dev tools to check the `editorjsData` field
3. **Test Fallback**: Disable the plugin temporarily to isolate issues

### Mobile Issues

1. **Viewport Meta Tag**: Ensure your theme includes proper viewport settings
2. **Touch Events**: Test on actual devices, not just browser dev tools
3. **Theme Conflicts**: Try with the default NodeBB theme

### Performance Issues

1. **CDN Accessibility**: Verify that Editor.js CDN URLs are accessible
2. **Script Loading**: Check network tab for failed script loads
3. **Memory Usage**: Monitor browser memory usage with large documents

## 🔐 Security

- **XSS Protection**: Built-in content sanitization
- **Input Validation**: All user input is validated before processing
- **CSP Compliance**: Compatible with Content Security Policy headers
- **No Eval**: No dynamic code execution or `eval()` usage

## 📊 Performance

- **Bundle Size**: ~200KB additional JavaScript (cached)
- **Load Time**: <500ms additional composer initialization
- **Memory Usage**: ~5-10MB additional memory for large documents
- **Conversion Speed**: <10ms for typical document sizes

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Make** your changes and add tests
4. **Lint** your code: `npm run lint:fix`
5. **Test** thoroughly: `npm test`
6. **Submit** a pull request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Use semantic commit messages
- Ensure backward compatibility

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Editor.js](https://editorjs.io/) - The amazing block-style editor
- [NodeBB](https://nodebb.org/) - The modern forum software
- [Unified.js](https://unifiedjs.com/) - Markdown processing ecosystem

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/hideya/nodebb-plugin-composer-editorjs/issues)
- **NodeBB Community**: [Get help from the community](https://community.nodebb.org/)
- **Documentation**: [Technical details](TECHNICAL.md)

## 🗺️ Roadmap

### v0.2.0 (Upcoming)
- Image upload integration with NodeBB file handling
- Enhanced table editor with formatting options
- Plugin configuration interface in admin panel
- Advanced formatting tools (text alignment, colors)

### v0.3.0 (Future)
- Custom NodeBB-specific block types (user mentions, topic links)
- Collaborative editing support
- Import/export functionality for various formats
- Advanced mobile gestures and shortcuts

---

**Made with ❤️ for the NodeBB community**
