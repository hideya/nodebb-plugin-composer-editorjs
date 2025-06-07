# WIP: NodeBB Plugin: Composer Editor.js

A NodeBB plugin that replaces the default markdown composer with a modern WYSIWYG block-style editor powered by [Editor.js](https://editorjs.io/).

## Key Architecture Points

- **Hybrid Integration Strategy**: The plugin works alongside the default composer plugin rather than replacing it completely, ensuring compatibility with NodeBB's core systems
- **Dual-Format Data Management**:
   - Editor.js JSON format for the rich editing experience
   - Markdown format for NodeBB storage and validation
- **Client-Server Conversion**: Bidirectional conversion between Editor.js JSON and Markdown on both client and server sides

## Features

- **Block-style editing**: Modern WYSIWYG editor with block-based content structure
- **Seamless integration**: Works **alongside** NodeBB's default composer plugin
- **Markdown compatibility**: Automatically converts between Editor.js JSON and markdown

## Supported Block Types

- **Paragraph**: Basic text blocks
- **Headers**: H1-H6 headings
- **Lists**: Both ordered and unordered lists
- Additional tools can be easily added

## Requirements

- NodeBB v4.0.0 or higher
- Node.js v14 or higher
- `nodebb-plugin-composer-default` must be active

## Installation

1. Clone or download this plugin to your NodeBB plugins directory:
   ```bash
   cd nodebb/node_modules
   git clone https://github.com/hideya/nodebb-plugin-composer-editorjs.git
   ```

2. Install dependencies:
   ```bash
   cd nodebb-plugin-composer-editorjs
   npm install
   ```

3. Make the plugin available for NodeBB:
   ```bash
   cd nodebb-plugin-composer-editorjs
   npm link
   
   cd your-nodebb-repo
   npm link nodebb-plugin-composer-editorjs
   ```
4. Rebuild and restart NodeBB:
   ```bash
   ./nodebb build
   ./nodebb restart
   ```

5. Activate the plugin in NodeBB Admin Panel:
   - Go to **Admin Panel** → **Extend** → **Plugins**
   - Find "NodeBB Plugin: Composer Editor.js" and click **Activate**

   **Important**: Ensure `nodebb-plugin-composer-default` is also activated for compatibility

## How It Works

1. **Editor Integration**: Injects Editor.js interface into the default composer
2. **Data Conversion**: Automatically converts Editor.js JSON to markdown for storage
3. **Bidirectional Sync**: Converts markdown back to Editor.js format for editing
4. **Validation Support**: Ensures NodeBB's content validation works properly

## Configuration

No additional configuration required. The plugin works out of the box once activated.

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

To extend the plugin with additional Editor.js tools:

1. Add the tool's CDN URL to `static/lib/editor.js`
2. Include the tool in the Editor.js configuration
3. Update the conversion functions in both client and server-side code

## Troubleshooting

### Editor doesn't appear
- Check browser console for JavaScript errors
- Ensure both this plugin and `nodebb-plugin-composer-default` are active
- Verify NodeBB rebuild completed successfully

### Content validation errors
- The plugin automatically converts Editor.js content to markdown for validation
- If issues persist, check that the conversion functions are working properly

### Mobile responsiveness issues
- The plugin includes responsive CSS for mobile devices
- Custom themes may require additional CSS adjustments

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the GitHub Issues page
- Review the technical documentation
- Test with a minimal NodeBB installation to isolate issues