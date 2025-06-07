# Changelog

All notable changes to the NodeBB Editor.js Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-06-07

### Added
- **Enhanced Editor.js Integration**
  - Improved script loading with versioned CDN URLs for stability
  - Better error handling and fallback mechanisms
  - Support for more block types (Code, Quote, Delimiter, Tables, Checklists)
  - Enhanced mobile responsiveness and touch interactions
  
- **Robust Conversion System**
  - Comprehensive JSON to Markdown converter with inline formatting support
  - Advanced Markdown to JSON parser handling complex structures
  - Round-trip conversion testing to ensure data integrity
  - Support for nested lists and complex block structures
  
- **Better User Experience**
  - Improved CSS with dark mode support
  - Loading states and error handling for better feedback
  - Responsive design optimized for mobile devices
  - Smooth animations and transitions
  
- **Development Infrastructure**
  - ESLint configuration for code quality
  - Unit tests for conversion functions
  - Comprehensive error logging and debugging
  - Performance optimizations and caching

### Changed
- **Script Loading Strategy**
  - Moved from `@latest` CDN URLs to pinned versions for stability
  - Implemented parallel loading for better performance
  - Added timeout and retry mechanisms
  
- **Editor Configuration**
  - Enhanced Editor.js tools configuration
  - Better placeholder text and user guidance
  - Improved toolbar positioning and accessibility
  
- **Data Handling**
  - More robust JSON parsing and validation
  - Better fallback handling for malformed data
  - Enhanced content sanitization and security

### Fixed
- **Mobile Issues**
  - Fixed toolbar positioning on small screens
  - Improved touch interactions and viewport handling
  - Better iOS Safari compatibility
  
- **Conversion Accuracy**
  - Fixed header level validation (1-6 range)
  - Better handling of empty blocks and edge cases
  - Improved inline formatting preservation
  
- **Performance**
  - Reduced memory usage through better caching
  - Optimized DOM manipulation and event handling
  - Faster initialization and content loading

### Security
- **Content Sanitization**
  - Enhanced XSS protection in conversion functions
  - Better HTML tag filtering and validation
  - Improved input validation for all block types

## [0.0.1] - Initial Release

### Added
- Basic Editor.js integration with NodeBB composer
- Simple paragraph and header block support
- Basic JSON to Markdown conversion
- Initial mobile responsive design
- Core plugin architecture and hooks

### Known Issues in Previous Version
- CDN loading reliability issues
- Limited block type support
- Mobile responsiveness problems
- Conversion accuracy issues
- Performance bottlenecks

---

## Upgrade Guide

### From 0.0.1 to 0.1.0

1. **Backup your data** - Always backup your NodeBB installation before upgrading
2. **Update dependencies** - Run `npm install` to get updated dependencies
3. **Rebuild NodeBB** - Run `./nodebb build` to rebuild assets
4. **Test thoroughly** - Verify that existing posts render correctly
5. **Check mobile** - Test the editor on mobile devices

### Breaking Changes
- None in this release - fully backward compatible

### New Features to Test
- Try the new Code, Quote, and Delimiter block types
- Test mobile responsiveness improvements
- Verify dark mode support (if your theme supports it)
- Check conversion accuracy with complex content

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify that both this plugin and `nodebb-plugin-composer-default` are active
3. Test with a minimal theme to isolate theme-specific issues
4. Report bugs with detailed reproduction steps

## Roadmap

### Planned for 0.2.0
- Image upload integration with NodeBB file handling
- Table editor improvements
- Custom NodeBB-specific block types
- Plugin configuration interface
- Advanced formatting options

### Long-term Goals
- Collaborative editing support
- Plugin API for custom blocks
- Import/export functionality
- Advanced theming options
