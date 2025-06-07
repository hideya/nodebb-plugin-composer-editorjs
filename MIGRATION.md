# Migration Guide

This guide helps you migrate from older versions of the plugin or from other NodeBB composer plugins.

## From Version 0.0.1 to 0.1.0

### Breaking Changes
- **None** - This release is fully backward compatible

### New Features
- Admin panel configuration interface
- Enhanced mobile support
- More block types (Code, Quote, Delimiter, Tables)
- Performance optimizations
- Better error handling

### Migration Steps

1. **Backup Your Data**
   ```bash
   # Stop NodeBB
   ./nodebb stop
   
   # Backup database
   mongodump --db nodebb --out backup-$(date +%Y%m%d)
   # OR for other databases, use appropriate backup commands
   ```

2. **Update the Plugin**
   ```bash
   cd /path/to/nodebb
   npm update nodebb-plugin-composer-editorjs
   ```

3. **Rebuild NodeBB**
   ```bash
   ./nodebb build
   ./nodebb start
   ```

4. **Configure New Settings**
   - Go to Admin Panel → Plugins → Editor.js Composer
   - Review and adjust settings as needed
   - Test the composer functionality

### What's Changed

#### Enhanced Features
- **Better Script Loading**: More reliable CDN loading with fallbacks
- **Mobile Improvements**: Better touch interactions and responsive design
- **New Block Types**: Code blocks, quotes, delimiters, and tables
- **Performance**: Faster initialization and better caching

#### Admin Configuration
- **Settings Panel**: Configure tools, CDN settings, and mobile options
- **Debug Mode**: Enable detailed logging for troubleshooting
- **Tool Selection**: Choose which block types to enable

#### Developer Improvements
- **ESLint Configuration**: Better code quality
- **Unit Tests**: Automated testing for conversion functions
- **Development Scripts**: Helper scripts for common tasks

## From Default NodeBB Composer

### Why Migrate?
- **Modern Interface**: Block-style editing is more intuitive
- **Better Mobile Experience**: Optimized for touch devices
- **Rich Content**: Support for various content types beyond text
- **Future-Proof**: Built on modern web technologies

### Migration Process

1. **Install the Plugin**
   ```bash
   cd /path/to/nodebb
   npm install nodebb-plugin-composer-editorjs
   ```

2. **Keep Default Composer Active**
   - ⚠️ **Important**: Do NOT deactivate `nodebb-plugin-composer-default`
   - Both plugins work together for compatibility

3. **Activate Editor.js Plugin**
   - Admin Panel → Plugins → Find "Editor.js Composer"
   - Click Activate
   - Rebuild NodeBB

4. **Test and Configure**
   - Create a test post to verify functionality
   - Configure settings in Admin Panel → Plugins → Editor.js Composer
   - Train users on the new interface

### Content Compatibility

#### Existing Posts
- **Automatic Conversion**: Existing markdown posts are automatically converted to Editor.js format when edited
- **No Data Loss**: Original markdown is preserved in the database
- **Backward Compatible**: Posts can be viewed and edited regardless of creation method

#### Supported Content Types

| Content Type | Markdown | Editor.js | Notes |
|--------------|----------|-----------|-------|
| Paragraphs | ✅ | ✅ | Full compatibility |
| Headers (H1-H6) | ✅ | ✅ | Full compatibility |
| Lists | ✅ | ✅ | Ordered and unordered |
| Code Blocks | ✅ | ✅ | Syntax highlighting |
| Quotes | ✅ | ✅ | With optional attribution |
| Links | ✅ | ✅ | Inline and reference |
| Images | ✅ | ⚠️ | Basic support, enhanced in future |
| Tables | ✅ | ✅ | Full markdown table support |

### User Training

#### For Content Creators
1. **Block Concept**: Content is organized in blocks rather than continuous text
2. **Block Addition**: Click the `+` button to add new blocks
3. **Block Types**: Use appropriate block types for different content
4. **Mobile Usage**: Swipe gestures and touch-optimized interface

#### For Administrators
1. **Monitor Usage**: Check for user feedback and adoption
2. **Configure Tools**: Enable/disable block types based on needs
3. **Performance**: Monitor page load times and user experience
4. **Fallback**: Default composer remains available if needed

## From Other Editor Plugins

### From nodebb-plugin-composer-quill

#### Similarities
- Both provide WYSIWYG editing experience
- Rich text formatting capabilities
- Better than plain markdown for non-technical users

#### Differences
- **Architecture**: Editor.js uses blocks, Quill uses continuous text
- **Storage**: Editor.js stores structured JSON, Quill stores HTML/delta
- **Extensibility**: Editor.js has modular block system

#### Migration Steps
1. **Export Content**: Use NodeBB's export functionality if available
2. **Install Editor.js Plugin**: Follow standard installation process
3. **Content Conversion**: May require manual conversion for complex formatting
4. **User Retraining**: Different interface paradigm

### From Custom Composer Solutions

#### Preparation
1. **Document Current Setup**: Note customizations and integrations
2. **Backup Thoroughly**: Both database and code customizations
3. **Test Environment**: Set up staging environment for testing

#### Integration Points
- **Hooks**: Verify compatibility with existing NodeBB hooks
- **Themes**: Check CSS compatibility with your theme
- **Plugins**: Test interaction with other plugins
- **Custom Code**: Review any custom composer modifications

## Rollback Procedures

### If Issues Occur

1. **Immediate Rollback**
   ```bash
   # Deactivate the plugin via admin panel
   # OR via command line:
   ./nodebb reset plugin nodebb-plugin-composer-editorjs
   ```

2. **Restore Previous Version**
   ```bash
   npm install nodebb-plugin-composer-editorjs@0.0.1
   ./nodebb build
   ./nodebb restart
   ```

3. **Complete Removal**
   ```bash
   npm uninstall nodebb-plugin-composer-editorjs
   ./nodebb build
   ./nodebb restart
   ```

### Data Safety
- **No Data Loss**: Plugin deactivation doesn't remove content
- **Markdown Preserved**: Original markdown content remains intact
- **Editor.js Data**: Stored separately, can be removed if needed

## Best Practices

### For Smooth Migration
1. **Staged Rollout**: Start with test/staging environment
2. **User Groups**: Begin with tech-savvy users first
3. **Documentation**: Provide user guides and training materials
4. **Feedback Loop**: Collect and address user feedback promptly

### Performance Optimization
1. **CDN Configuration**: Consider self-hosting Editor.js scripts
2. **Tool Selection**: Only enable needed block types
3. **Mobile Testing**: Verify performance on actual mobile devices
4. **Monitoring**: Track page load times and user engagement

### Troubleshooting
1. **Debug Mode**: Enable for detailed logging
2. **Browser Console**: Check for JavaScript errors
3. **Network Tab**: Verify script loading success
4. **Fallback Testing**: Ensure graceful degradation

## Support and Resources

### Getting Help
- **GitHub Issues**: [Report bugs and request features](https://github.com/hideya/nodebb-plugin-composer-editorjs/issues)
- **NodeBB Community**: [Community forum discussions](https://community.nodebb.org/)
- **Documentation**: [Technical documentation](TECHNICAL.md)

### Useful Commands
```bash
# Check plugin status
./nodebb plugins list

# Rebuild with debug info
DEBUG=* ./nodebb build

# Reset plugin settings
./nodebb reset plugin nodebb-plugin-composer-editorjs

# View plugin logs
./nodebb log | grep "Editor.js Plugin"
```

### Community Resources
- **Plugin Repository**: Latest code and releases
- **Example Configurations**: Community-shared setups
- **Custom Block Examples**: How to add custom blocks
- **Theme Compatibility**: Known working themes

---

**Need help with migration? Open an issue on GitHub with your specific scenario.**
