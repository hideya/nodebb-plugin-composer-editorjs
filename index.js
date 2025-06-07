'use strict';

const plugin = module.exports;
const nconf = require.main.require('nconf');
const meta = require.main.require('./src/meta');

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  placeholder: "Let's write an awesome story!",
  debugMode: false,
  tools: {
    header: true,
    list: true,
    code: true,
    quote: true,
    delimiter: true,
    table: false
  },
  cdnBase: 'https://cdn.jsdelivr.net/npm',
  loadTimeout: 10000,
  lazyLoad: false,
  mobileOptimized: true,
  touchGestures: true
};

// Cache for settings and conversion functions
let pluginSettings = null;
let jsonToMarkdown = null;
let markdownToJson = null;

/**
 * Load plugin settings with defaults
 */
async function loadSettings() {
  if (!pluginSettings) {
    try {
      pluginSettings = await meta.settings.get('composer-editorjs');
      
      // Merge with defaults
      pluginSettings = { ...DEFAULT_SETTINGS, ...pluginSettings };
    } catch (error) {
      console.error('[Editor.js Plugin] Failed to load settings:', error);
      pluginSettings = DEFAULT_SETTINGS;
    }
  }
  return pluginSettings;
}

/**
 * Load conversion functions with error handling
 */
function loadConverters() {
  if (!jsonToMarkdown) {
    try {
      jsonToMarkdown = require('./static/lib/json-to-md');
    } catch (error) {
      console.error('[Editor.js Plugin] Failed to load json-to-md converter:', error);
      jsonToMarkdown = (data) => {
        // Fallback converter
        if (!data || !data.blocks) return '';
        return data.blocks.map(block => {
          const text = block.data?.text || block.data?.code || '';
          return text ? `${text}\n` : '';
        }).join('\n');
      };
    }
  }

  if (!markdownToJson) {
    try {
      markdownToJson = require('./static/lib/md-to-json');
    } catch (error) {
      console.error('[Editor.js Plugin] Failed to load md-to-json converter:', error);
      markdownToJson = (markdown) => {
        // Fallback converter
        return {
          time: Date.now(),
          version: '2.28.2',
          blocks: markdown ? [{
            type: 'paragraph',
            data: { text: markdown }
          }] : []
        };
      };
    }
  }
}

/**
 * Hook: filter:composer.format
 * Converts Editor.js JSON data to markdown for storage
 */
plugin.format = async (data) => {
  try {
    const settings = await loadSettings();
    
    // Skip if plugin is disabled
    if (!settings.enabled) {
      return data;
    }

    loadConverters();

    // Check if we have Editor.js data
    const editorData = data.post.editorjsData;
    
    if (editorData && typeof editorData === 'string') {
      try {
        const parsedData = JSON.parse(editorData);
        
        // Validate the parsed data structure
        if (parsedData && (Array.isArray(parsedData.blocks) || Array.isArray(parsedData))) {
          const markdown = jsonToMarkdown(parsedData);
          
          if (markdown && markdown.trim()) {
            data.post.content = markdown;
            if (settings.debugMode) {
              console.log('[Editor.js Plugin] Converted Editor.js data to markdown');
            }
          }
        }
      } catch (parseError) {
        console.error('[Editor.js Plugin] Failed to parse Editor.js data:', parseError);
        // Don't modify content if parsing fails
      }
    }
  } catch (error) {
    console.error('[Editor.js Plugin] Error in format hook:', error);
  }

  return data;
};

/**
 * Hook: filter:composer.get
 * Converts markdown to Editor.js JSON format for editing
 */
plugin.get = async (data) => {
  try {
    const settings = await loadSettings();
    
    // Skip if plugin is disabled
    if (!settings.enabled) {
      return data;
    }

    loadConverters();

    // Only convert if we don't already have Editor.js data and we have content
    if (data.post.content && !data.post.editorjsData) {
      try {
        const editorData = markdownToJson(data.post.content);
        
        // Validate the conversion result
        if (editorData && Array.isArray(editorData.blocks)) {
          data.post.editorjsData = JSON.stringify(editorData);
          if (settings.debugMode) {
            console.log('[Editor.js Plugin] Converted markdown to Editor.js format');
          }
        }
      } catch (conversionError) {
        console.error('[Editor.js Plugin] Failed to convert markdown to Editor.js:', conversionError);
        // Provide fallback Editor.js data
        data.post.editorjsData = JSON.stringify({
          time: Date.now(),
          version: '2.28.2',
          blocks: data.post.content ? [{
            type: 'paragraph',
            data: { text: data.post.content }
          }] : []
        });
      }
    }
  } catch (error) {
    console.error('[Editor.js Plugin] Error in get hook:', error);
  }

  return data;
};

/**
 * Hook: static:app.load
 * Initialize plugin when NodeBB starts
 */
plugin.init = async (params) => {
  console.log('[Editor.js Plugin] Initializing...');
  
  try {
    // Pre-load settings and converters
    await loadSettings();
    loadConverters();
    console.log('[Editor.js Plugin] Initialized successfully');
  } catch (error) {
    console.error('[Editor.js Plugin] Failed to initialize:', error);
  }
};

/**
 * Hook: filter:admin.header.build
 * Add admin navigation
 */
plugin.addAdminNavigation = async (header) => {
  header.plugins.push({
    route: '/plugins/composer-editorjs',
    icon: 'fa-edit',
    name: 'Editor.js Composer'
  });

  return header;
};

/**
 * Hook: filter:scripts.get
 * Add plugin settings to client-side
 */
plugin.addScripts = async (data) => {
  const settings = await loadSettings();
  
  // Only add scripts if plugin is enabled
  if (settings.enabled) {
    data.scripts.push({
      src: '/plugins/nodebb-plugin-composer-editorjs/static/lib/editor.js',
      defer: true
    });
  }

  return data;
};

/**
 * Admin routes
 */
plugin.addRoutes = async ({ router, middleware, helpers }) => {
  const routeHelpers = require.main.require('./src/routes/helpers');

  // Admin settings page
  router.get('/admin/plugins/composer-editorjs', middleware.admin.buildHeader, renderAdmin);
  router.get('/api/admin/plugins/composer-editorjs', renderAdmin);

  // Settings API endpoints
  router.post('/api/admin/plugins/composer-editorjs/save', middleware.admin.isAdmin, saveSettings);
  router.post('/api/admin/plugins/composer-editorjs/reset', middleware.admin.isAdmin, resetSettings);
  router.post('/api/admin/plugins/composer-editorjs/clear-cache', middleware.admin.isAdmin, clearCache);

  async function renderAdmin(req, res) {
    const settings = await loadSettings();
    
    res.render('admin/plugins/composer-editorjs', {
      ...settings,
      title: 'Editor.js Composer Settings'
    });
  }

  async function saveSettings(req, res) {
    try {
      await meta.settings.set('composer-editorjs', req.body);
      
      // Clear cached settings
      pluginSettings = null;
      
      res.json({ success: true });
    } catch (error) {
      console.error('[Editor.js Plugin] Failed to save settings:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async function resetSettings(req, res) {
    try {
      await meta.settings.set('composer-editorjs', DEFAULT_SETTINGS);
      
      // Clear cached settings
      pluginSettings = null;
      
      res.json({ success: true });
    } catch (error) {
      console.error('[Editor.js Plugin] Failed to reset settings:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async function clearCache(req, res) {
    try {
      // Clear cached settings and converters
      pluginSettings = null;
      jsonToMarkdown = null;
      markdownToJson = null;
      
      res.json({ success: true });
    } catch (error) {
      console.error('[Editor.js Plugin] Failed to clear cache:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

/**
 * Hook: filter:config.get
 * Add plugin settings to client-side config
 */
plugin.addConfig = async (config) => {
  const settings = await loadSettings();
  
  config['composer-editorjs'] = {
    enabled: settings.enabled,
    placeholder: settings.placeholder,
    debugMode: settings.debugMode,
    tools: settings.tools,
    cdnBase: settings.cdnBase,
    loadTimeout: settings.loadTimeout,
    lazyLoad: settings.lazyLoad,
    mobileOptimized: settings.mobileOptimized,
    touchGestures: settings.touchGestures
  };

  return config;
};

/**
 * Plugin metadata
 */
plugin.getMetadata = () => {
  return {
    name: 'NodeBB Editor.js Composer',
    description: 'Modern WYSIWYG block-style editor for NodeBB',
    version: '0.1.0',
    author: 'hideya kawahara',
    url: 'https://github.com/hideya/nodebb-plugin-composer-editorjs'
  };
};

/**
 * Hook: action:plugin.deactivate
 * Cleanup when plugin is deactivated
 */
plugin.onDeactivate = async (data) => {
  if (data.id === 'nodebb-plugin-composer-editorjs') {
    console.log('[Editor.js Plugin] Plugin deactivated, clearing cache...');
    
    // Clear all cached data
    pluginSettings = null;
    jsonToMarkdown = null;
    markdownToJson = null;
  }
};
