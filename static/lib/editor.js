// Editor.js Plugin for NodeBB Composer - Enhanced with Settings Support
(function() {
  'use strict';

  // Get plugin settings from NodeBB config
  const PLUGIN_CONFIG = config['composer-editorjs'] || {};
  
  // Configuration with defaults
  const EDITOR_CONFIG = {
    CDN_BASE: PLUGIN_CONFIG.cdnBase || 'https://cdn.jsdelivr.net/npm',
    EDITOR_VERSION: '2.28.2',
    TIMEOUT: PLUGIN_CONFIG.loadTimeout || 10000,
    DEBUG: PLUGIN_CONFIG.debugMode || false,
    ENABLED: PLUGIN_CONFIG.enabled !== false,
    PLACEHOLDER: PLUGIN_CONFIG.placeholder || "Let's write an awesome story!",
    LAZY_LOAD: PLUGIN_CONFIG.lazyLoad || false,
    MOBILE_OPTIMIZED: PLUGIN_CONFIG.mobileOptimized !== false,
    TOUCH_GESTURES: PLUGIN_CONFIG.touchGestures !== false
  };

  // Exit early if plugin is disabled
  if (!EDITOR_CONFIG.ENABLED) {
    debug('Plugin is disabled, skipping initialization');
    return;
  }

  // Tool configuration from settings
  const ENABLED_TOOLS = PLUGIN_CONFIG.tools || {
    header: true,
    list: true,
    code: true,
    quote: true,
    delimiter: true,
    table: false
  };

  // Tool definitions with version pinning
  const AVAILABLE_TOOLS = [
    {
      name: 'EditorJS',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/editorjs@${EDITOR_CONFIG.EDITOR_VERSION}/dist/editor.min.js`,
      check: () => typeof EditorJS !== 'undefined',
      required: true
    },
    {
      name: 'Header',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/header@2.7.0/dist/bundle.js`,
      check: () => typeof Header !== 'undefined',
      enabled: ENABLED_TOOLS.header
    },
    {
      name: 'List',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/list@1.8.0/dist/bundle.js`,
      check: () => typeof List !== 'undefined',
      enabled: ENABLED_TOOLS.list
    },
    {
      name: 'Code',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/code@2.8.0/dist/bundle.js`,
      check: () => typeof CodeTool !== 'undefined',
      enabled: ENABLED_TOOLS.code
    },
    {
      name: 'Quote',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/quote@2.5.0/dist/bundle.js`,
      check: () => typeof Quote !== 'undefined',
      enabled: ENABLED_TOOLS.quote
    },
    {
      name: 'Delimiter',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/delimiter@1.3.0/dist/bundle.js`,
      check: () => typeof Delimiter !== 'undefined',
      enabled: ENABLED_TOOLS.delimiter
    },
    {
      name: 'Table',
      src: `${EDITOR_CONFIG.CDN_BASE}/@editorjs/table@2.2.1/dist/table.js`,
      check: () => typeof Table !== 'undefined',
      enabled: ENABLED_TOOLS.table
    }
  ];

  // Performance monitoring
  const performanceMetrics = {
    startTime: null,
    scriptsLoadTime: null,
    editorInitTime: null,
    totalInitTime: null
  };

  // Utility functions
  function debug(...args) {
    if (EDITOR_CONFIG.DEBUG) {
      console.log('[Editor.js Plugin]:', ...args);
    }
  }

  function error(...args) {
    console.error('[Editor.js Plugin Error]:', ...args);
  }

  function startPerformanceTracking() {
    performanceMetrics.startTime = performance.now();
  }

  function logPerformanceMetric(name, time) {
    if (EDITOR_CONFIG.DEBUG) {
      debug(`Performance - ${name}: ${(time - performanceMetrics.startTime).toFixed(2)}ms`);
    }
  }

  // Enhanced script loader with retry and fallback
  function loadScript(tool) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (tool.check && tool.check()) {
        debug(`${tool.name} already loaded`);
        resolve();
        return;
      }

      // Skip if tool is disabled
      if (tool.enabled === false && !tool.required) {
        debug(`${tool.name} is disabled, skipping`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = tool.src;
      script.async = true;
      script.crossOrigin = 'anonymous';

      const timer = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout loading ${tool.name}`));
      }, EDITOR_CONFIG.TIMEOUT);

      script.onload = () => {
        clearTimeout(timer);
        debug(`Successfully loaded ${tool.name}`);
        resolve();
      };

      script.onerror = (e) => {
        clearTimeout(timer);
        script.remove();
        error(`Failed to load ${tool.name}:`, e);
        
        // For required tools, reject immediately
        if (tool.required) {
          reject(new Error(`Failed to load required tool ${tool.name}`));
        } else {
          // For optional tools, resolve anyway
          debug(`Optional tool ${tool.name} failed to load, continuing`);
          resolve();
        }
      };

      document.head.appendChild(script);
    });
  }

  // Load all required scripts
  async function loadEditorJSScripts() {
    startPerformanceTracking();
    
    try {
      // Load EditorJS core first
      const coreScript = AVAILABLE_TOOLS.find(tool => tool.name === 'EditorJS');
      await loadScript(coreScript);
      
      // Load enabled tools in parallel for better performance
      const toolPromises = AVAILABLE_TOOLS
        .filter(tool => tool.name !== 'EditorJS' && tool.enabled !== false)
        .map(tool => loadScript(tool));
      
      await Promise.allSettled(toolPromises);
      
      performanceMetrics.scriptsLoadTime = performance.now();
      logPerformanceMetric('Scripts loaded', performanceMetrics.scriptsLoadTime);
      
      debug('All scripts loaded successfully');
    } catch (error) {
      error('Failed to load essential scripts:', error);
      throw error;
    }
  }

  // Enhanced markdown conversion with better block handling
  function convertEditorJsToMarkdown(data) {
    if (!data || !Array.isArray(data.blocks)) return '';

    return data.blocks.map(block => {
      const { type, data } = block;
      
      switch (type) {
        case 'paragraph':
          return data.text ? `${data.text}\n` : '';
          
        case 'header':
          const level = Math.max(1, Math.min(6, data.level || 1));
          return data.text ? `${'#'.repeat(level)} ${data.text}\n` : '';
          
        case 'list':
          if (!data.items || !Array.isArray(data.items)) return '';
          return data.items.map((item, i) => {
            const bullet = data.style === 'ordered' ? `${i + 1}.` : '-';
            return `${bullet} ${item}`;
          }).join('\n') + '\n';
          
        case 'code':
          return data.code ? `\`\`\`${data.language || ''}\n${data.code}\n\`\`\`\n` : '';
          
        case 'quote':
          const quote = data.text ? `> ${data.text}\n` : '';
          const caption = data.caption ? `>\n> — ${data.caption}\n` : '';
          return quote + caption;
          
        case 'delimiter':
          return '---\n';

        case 'table':
          if (!data.content || !Array.isArray(data.content)) return '';
          const rows = data.content.map(row => 
            '| ' + row.map(cell => cell || '').join(' | ') + ' |'
          );
          if (rows.length > 0) {
            const separator = '| ' + data.content[0].map(() => '---').join(' | ') + ' |';
            rows.splice(1, 0, separator);
          }
          return rows.join('\n') + '\n';
          
        default:
          debug(`Unknown block type: ${type}`);
          return data.text ? `${data.text}\n` : '';
      }
    }).filter(Boolean).join('\n');
  }

  // Create tools configuration based on enabled tools
  function createToolsConfig() {
    const tools = {};

    if (ENABLED_TOOLS.header && typeof Header !== 'undefined') {
      tools.header = {
        class: Header,
        config: {
          placeholder: 'Enter a header',
          levels: [1, 2, 3, 4, 5, 6],
          defaultLevel: 2
        }
      };
    }

    if (ENABLED_TOOLS.list && typeof List !== 'undefined') {
      tools.list = List;
    }

    if (ENABLED_TOOLS.code && typeof CodeTool !== 'undefined') {
      tools.code = CodeTool;
    }

    if (ENABLED_TOOLS.quote && typeof Quote !== 'undefined') {
      tools.quote = Quote;
    }

    if (ENABLED_TOOLS.delimiter && typeof Delimiter !== 'undefined') {
      tools.delimiter = Delimiter;
    }

    if (ENABLED_TOOLS.table && typeof Table !== 'undefined') {
      tools.table = Table;
    }

    return tools;
  }

  // Mobile-specific optimizations
  function applyMobileOptimizations($container) {
    if (!EDITOR_CONFIG.MOBILE_OPTIMIZED) return;

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      $container.addClass('mobile-optimized');
      
      // Add touch gesture support if enabled
      if (EDITOR_CONFIG.TOUCH_GESTURES) {
        addTouchGestureSupport($container);
      }
    }
  }

  function addTouchGestureSupport($container) {
    // Simple swipe detection for mobile block operations
    let startY = 0;
    let startX = 0;

    $container.on('touchstart', '.ce-block', function(e) {
      startY = e.originalEvent.touches[0].clientY;
      startX = e.originalEvent.touches[0].clientX;
    });

    $container.on('touchend', '.ce-block', function(e) {
      if (!startY || !startX) return;

      const endY = e.originalEvent.changedTouches[0].clientY;
      const endX = e.originalEvent.changedTouches[0].clientX;
      const diffY = startY - endY;
      const diffX = startX - endX;

      // Detect swipe gestures (minimum 50px movement)
      if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
        if (diffX > 0) {
          // Swipe left - could trigger block options
          debug('Swipe left detected on block');
        } else {
          // Swipe right - could trigger block menu
          debug('Swipe right detected on block');
        }
      }

      startY = 0;
      startX = 0;
    });
  }

  // Enhanced composer integration with better error handling
  async function initializeEditor() {
    debug('Starting editor initialization');
    startPerformanceTracking();

    try {
      // Load scripts (skip if lazy loading and not needed yet)
      if (!EDITOR_CONFIG.LAZY_LOAD || $('[component="composer"]').length > 0) {
        await loadEditorJSScripts();
      }
    } catch (error) {
      error('Failed to load scripts, falling back to default composer');
      return;
    }

    // Find composer elements
    const $composer = $('[component="composer"]');
    const $textarea = $composer.find('textarea[data-action="composer.write"]');
    
    if (!$textarea.length) {
      debug('Composer textarea not found');
      return;
    }

    debug('Found composer textarea, setting up Editor.js');

    // Create editor container with loading state
    const $editorContainer = $('<div id="editorjs-container" class="loading"><div id="editorjs"></div></div>');
    $textarea.before($editorContainer);

    // Apply mobile optimizations
    applyMobileOptimizations($editorContainer);

    // Create hidden input for Editor.js data
    let $hiddenInput = $composer.find('input[name="editorjsData"]');
    if (!$hiddenInput.length) {
      $hiddenInput = $('<input type="hidden" name="editorjsData">');
      $textarea.after($hiddenInput);
    }

    try {
      // Initialize Editor.js with enhanced configuration
      const tools = createToolsConfig();
      
      const editor = new EditorJS({
        holder: 'editorjs',
        placeholder: EDITOR_CONFIG.PLACEHOLDER,
        tools: tools,
        
        onChange: async () => {
          try {
            const outputData = await editor.save();
            const markdown = convertEditorJsToMarkdown(outputData);
            
            // Update both hidden input and textarea
            $hiddenInput.val(JSON.stringify(outputData));
            $textarea.val(markdown);
            
            debug('Content synchronized:', { 
              blocks: outputData.blocks.length, 
              markdown: markdown.length 
            });
          } catch (error) {
            error('Failed to save editor content:', error);
          }
        },

        onReady: () => {
          performanceMetrics.editorInitTime = performance.now();
          logPerformanceMetric('Editor initialized', performanceMetrics.editorInitTime);
          
          debug('Editor.js is ready');
          
          // Remove loading state
          $editorContainer.removeClass('loading');
          
          // Hide textarea and formatting bar
          $textarea.hide();
          $composer.find('.formatting-bar').hide();
          
          // Load existing content
          const existingMarkdown = $textarea.val();
          if (existingMarkdown && existingMarkdown.trim()) {
            try {
              // Use server-side conversion if available, otherwise simple client-side
              const editorData = parseMarkdownToEditorJs(existingMarkdown);
              editor.render(editorData);
              debug('Loaded existing content');
            } catch (error) {
              error('Failed to load existing content:', error);
            }
          }

          performanceMetrics.totalInitTime = performance.now();
          logPerformanceMetric('Total initialization', performanceMetrics.totalInitTime);
        }
      });

      // Handle form submission
      const $form = $textarea.closest('form');
      if ($form.length) {
        $form.on('submit.editorjs', async function(e) {
          try {
            const outputData = await editor.save();
            const markdown = convertEditorJsToMarkdown(outputData);
            
            $textarea.val(markdown);
            $hiddenInput.val(JSON.stringify(outputData));
            
            debug('Form submission: content updated');
          } catch (error) {
            error('Form submission error:', error);
            // Don't prevent submission, let default handling occur
          }
        });
      }

      // Handle composer reset/close
      $(window).on('action:composer.discard action:composer.close', function() {
        try {
          if (editor && typeof editor.destroy === 'function') {
            editor.destroy();
            debug('Editor destroyed');
          }
          $form.off('submit.editorjs');
        } catch (error) {
          error('Failed to cleanup editor:', error);
        }
      });

      debug('Editor.js initialization complete');

    } catch (editorError) {
      error('Failed to initialize Editor.js:', editorError);
      
      // Show error state and fall back to default composer
      $editorContainer.addClass('error').removeClass('loading');
      $textarea.show();
      $composer.find('.formatting-bar').show();
    }
  }

  // Simple client-side markdown parser for basic content loading
  function parseMarkdownToEditorJs(markdown) {
    if (!markdown) return { blocks: [] };

    const lines = markdown.split('\n');
    const blocks = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) continue;

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        blocks.push({
          type: 'header',
          data: {
            text: headerMatch[2],
            level: headerMatch[1].length
          }
        });
        continue;
      }

      // Code blocks
      if (line === '```' || line.startsWith('```')) {
        const language = line.replace('```', '');
        const codeLines = [];
        i++; // Move to next line
        
        while (i < lines.length && lines[i] !== '```') {
          codeLines.push(lines[i]);
          i++;
        }
        
        blocks.push({
          type: 'code',
          data: {
            code: codeLines.join('\n'),
            language: language
          }
        });
        continue;
      }

      // Lists (simple detection)
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = /^\d+\./.test(listMatch[2]);
        blocks.push({
          type: 'list',
          data: {
            style: isOrdered ? 'ordered' : 'unordered',
            items: [listMatch[3]]
          }
        });
        continue;
      }

      // Quotes
      const quoteMatch = line.match(/^>\s+(.+)$/);
      if (quoteMatch) {
        blocks.push({
          type: 'quote',
          data: {
            text: quoteMatch[1]
          }
        });
        continue;
      }

      // Delimiter
      if (line.match(/^-{3,}$/)) {
        blocks.push({
          type: 'delimiter',
          data: {}
        });
        continue;
      }

      // Default to paragraph
      blocks.push({
        type: 'paragraph',
        data: {
          text: line
        }
      });
    }

    return {
      time: Date.now(),
      version: EDITOR_CONFIG.EDITOR_VERSION,
      blocks
    };
  }

  // Initialize when composer is loaded
  $(window).on('action:composer.loaded', function() {
    debug('Composer loaded event received');
    
    // Small delay to ensure DOM is ready
    setTimeout(initializeEditor, 100);
  });

  // Also try to initialize if composer is already present
  $(document).ready(function() {
    if ($('[component="composer"]').length && !EDITOR_CONFIG.LAZY_LOAD) {
      debug('Composer already present, initializing');
      setTimeout(initializeEditor, 100);
    }
  });

  // Expose debug info for development
  if (EDITOR_CONFIG.DEBUG) {
    window.editorjsPlugin = {
      config: EDITOR_CONFIG,
      tools: ENABLED_TOOLS,
      metrics: performanceMetrics,
      reinitialize: initializeEditor
    };
  }

})();
