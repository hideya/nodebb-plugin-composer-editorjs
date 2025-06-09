/**
 * NodeBB Plugin: Composer Editor.js - Client-side Integration
 * 
 * This file handles the client-side integration of Editor.js with NodeBB's composer.
 * 
 * ASYMMETRIC CONVERSION ARCHITECTURE:
 * - JSON→MD: Client-side (this file) - simple object mapping, lightweight
 * - MD→JSON: Server-side (md-to-json.js) - complex AST parsing, requires libraries
 * 
 * KEY PRINCIPLE: "Server does the heavy lifting for MD→JSON because it has the tools, 
 * client does the simple JSON→MD because it can handle it easily."
 */

/**
 * Convert Editor.js JSON data to markdown (client-side conversion).
 * 
 * This handles the simple JSON→MD conversion because:
 * - Simple object mapping, no heavy libraries needed
 * - Client needs to populate textarea for NodeBB validation/storage
 * - Conversion happens before form submission (not real-time for performance)
 * 
 * @param {Object} data - Editor.js save data containing blocks array
 * @returns {string} Markdown formatted content
 */
function convertEditorJsToMarkdown(data) {
  if (!data || !Array.isArray(data.blocks)) return '';

  return data.blocks.map(block => {
    const { type, data } = block;
    
    // Convert each Editor.js block to its markdown equivalent
    switch (type) {
      case 'paragraph':
        return `${data.text}\n`;
      case 'header':
        return `${'#'.repeat(data.level)} ${data.text}\n`;
      case 'list':
        return convertListToMarkdown(data, 0);
      default:
        // Fallback for unknown block types
        return `${data.text || ''}\n`;
    }
  }).join('\n');
}

/**
 * Helper function to convert List 2.0 format to markdown (client-side).
 * Handles nested lists and different list styles (ordered, unordered, checklist).
 * 
 * @param {Object} listData - Editor.js list block data
 * @param {number} depth - Nesting level for indentation
 * @returns {string} Markdown formatted list
 */
function convertListToMarkdown(listData, depth = 0) {
  if (!listData.items || !Array.isArray(listData.items)) return '';
  
  const indent = '  '.repeat(depth); // 2 spaces per nesting level
  let result = '';
  
  listData.items.forEach((item, index) => {
    let bullet;
    
    // Handle different list styles
    if (listData.style === 'ordered') {
      bullet = `${index + 1}.`;
    } else if (listData.style === 'checklist') {
      // Check if item is checked (meta.checked)
      const isChecked = item.meta && item.meta.checked;
      bullet = isChecked ? '- [x]' : '- [ ]';
    } else {
      // Default to unordered
      bullet = '-';
    }
    
    // Add the list item content
    const content = item.content || '';
    result += `${indent}${bullet} ${content}\n`;
    
    // Handle nested items (List 2.0 supports nesting)
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      const nestedListData = {
        style: listData.style,
        items: item.items
      };
      result += convertListToMarkdown(nestedListData, depth + 1);
    }
  });
  
  return result;
}

/**
 * Patch Editor.js toolbar positioning to appear on the left side.
 * 
 * PROBLEM: Editor.js toolbar appears on right side in NodeBB's composer context
 * due to CSS conflicts between Editor.js positioning and NodeBB's layout.
 * 
 * SOLUTION: Hybrid CSS + JavaScript approach:
 * - CSS provides layout structure (margin-left for toolbar space)
 * - JavaScript calculates exact positioning relative to content area
 * - MutationObserver handles dynamic toolbar creation/changes
 */
function patchToolbarPositioning() {
  console.log('Patching Editor.js toolbar positioning...');
  
  // Function to force toolbar to left side
  function forceToolbarLeft() {
    const toolbar = document.querySelector('#editorjs .ce-toolbar');
    if (toolbar) {
      let leftPosition;
      
      // Check if mobile view
      if (window.innerWidth <= 768) {  // FIXME: hardcoded value
        leftPosition = '0px';
      } else {
        // Calculate position relative to ce-block__content
        const blockContent = document.querySelector('#editorjs .ce-block__content');
        
        if (blockContent) {
          const blockContentRect = blockContent.getBoundingClientRect();
          const editorContainer = document.getElementById('editorjs');
          const editorRect = editorContainer.getBoundingClientRect();
          
          // Calculate offset from editor container to block content left edge
          const offsetToBlockContent = blockContentRect.left - editorRect.left;
          
          // Position toolbar at about -10px from where the text actually starts
          const toolbarRightMargin = 10;  // FIXME: hardcoded value
          leftPosition = `${offsetToBlockContent - toolbarRightMargin}px`;
          
          // console.log('Calculated toolbar position:', {
          //   editorLeft: editorRect.left,
          //   blockContentLeft: blockContentRect.left,
          //   offsetToBlockContent: offsetToBlockContent,
          //   finalPosition: leftPosition
          // });
        } else {
          // Fallback to standard Editor.js position
          leftPosition = '0px';
        }
      }
      
      // Apply the calculated position
      toolbar.style.left = leftPosition;
      toolbar.style.right = 'auto';
      toolbar.style.transform = 'none';
      // console.log(`Toolbar positioned to left: ${leftPosition}`);
    }
    
    // Also fix any toolbox popups with same logic
    const popover = document.querySelector('#editorjs .ce-popover');
    if (popover && toolbar) {
      // Use same position as toolbar
      popover.style.left = toolbar.style.left;
      popover.style.right = 'auto';
      // console.log(`Popover positioned to left: ${toolbar.style.left}`);
    }
  }
  
  // Apply positioning immediately
  forceToolbarLeft();
  
  // Set up observer to catch dynamically created toolbars
  const observer = new MutationObserver((mutations) => {
    let shouldReposition = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check if toolbar or popover was added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('ce-toolbar') ||
                node.classList?.contains('ce-popover') ||
                node.querySelector?.('.ce-toolbar') ||
                node.querySelector?.('.ce-popover')) {
              shouldReposition = true;
            }
          }
        });
      }
      
      // Check if toolbar position was modified
      if (mutation.type === 'attributes' &&
          mutation.target.classList?.contains('ce-toolbar')) {
        shouldReposition = true;
      }
    });
    
    if (shouldReposition) {
      // Use timeout to let Editor.js finish its positioning first
      setTimeout(forceToolbarLeft, 50);
    }
  });
  
  // Start observing the editor container
  const editorContainer = document.getElementById('editorjs');
  if (editorContainer) {
    observer.observe(editorContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    console.log('Toolbar positioning observer started');
  }
  
  // Also patch on window resize
  window.addEventListener('resize', () => {
    setTimeout(forceToolbarLeft, 100);
  });
}

/**
 * Load Editor.js scripts dynamically from CDN with error handling.
 * 
 * Uses pinned versions for stability (updated 2025-06-07):
 * - @editorjs/editorjs@2.30.8 (core)
 * - @editorjs/header@2.8.8 (header tool)
 * - @editorjs/list@2.0.8 (list tool)
 * 
 * @returns {Promise} Resolves when all scripts are loaded successfully
 */
function loadEditorJSScripts() {
  return new Promise((resolve, reject) => {
    if (typeof EditorJS !== 'undefined') {
      resolve();
      return;
    }

    // Load Editor.js core and essential tools
    // Version pinned on 2025-06-07 for stability (was using @latest)
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.8',
      'https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.8',
      'https://cdn.jsdelivr.net/npm/@editorjs/list@2.0.8',
    ];

    let loadedCount = 0;
    let hasError = false;
    
    scripts.forEach((src, index) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log(`Loaded script ${index + 1}/${scripts.length}: ${src}`);
        loadedCount++;
        if (loadedCount === scripts.length && !hasError) {
          // Add a small delay to ensure global variables are exposed
          setTimeout(() => {
            resolve();
          }, 100);
        }
      };
      script.onerror = (error) => {
        hasError = true;
        console.error(`Failed to load script: ${src}`, error);
        reject(new Error(`Failed to load: ${src}`));
      };
      document.head.appendChild(script);
    });
  });
}

/**
 * Main initialization function - integrates Editor.js with NodeBB composer.
 * 
 * ARCHITECTURE OVERVIEW:
 * 1. Load Editor.js scripts dynamically
 * 2. Replace textarea with Editor.js interface
 * 3. Set up bidirectional data synchronization:
 *    - Editor.js changes → JSON → Markdown → textarea (for NodeBB)
 *    - Existing content: Server MD → JSON → Editor.js rendering
 * 4. Apply toolbar positioning fixes
 * 5. Handle form submission with final conversion
 */
$(window).on('action:composer.loaded', async function() {
  console.log('Editor.js plugin: Composer loaded event triggered');
  
  try {
    await loadEditorJSScripts();
    console.log('Editor.js scripts loaded successfully');
  } catch (error) {
    console.error('Failed to load Editor.js scripts:', error);
    return;
  }
  
  // Check if Editor.js is available
  if (typeof EditorJS === 'undefined') {
    console.error('Editor.js still not available after loading scripts');
    return;
  }

  // Find the composer textarea
  const textarea = $('[component="composer"] textarea');
  console.log('📍 Found textarea:', textarea.length);
  console.log('📍 Textarea element:', textarea[0]);
  console.log('📍 Initial textarea content:', textarea.val());
  console.log('📍 Initial textarea content length:', textarea.val().length);
  if (!textarea.length) return;

  // Create Editor.js container with full width and responsive design
  const editorContainer = $('<div id="editorjs"></div>');
  // textarea.after(editorContainer);
  textarea.before(editorContainer);  // Put Editor.js above textarea
  // textarea.parent().append(editorContainer);  // Put at end of composer
  // const wrapper = $('<div class="editor-wrapper"></div>');
  // textarea.after(wrapper);
  // wrapper.append(editorContainer);

  // Don't hide textarea yet - wait for Editor.js to initialize
  console.log('Editor.js container created');

  try {
    // Initialize Editor.js with basic tools
    // Check for global variables with fallback
    const HeaderTool = window.Header;
    const ListTool = window.EditorjsList || window.List; // List 2.0 uses EditorjsList

    if (!HeaderTool) {
      console.error('Header tool not available globally');
      throw new Error('Header tool not loaded');
    }

    if (!ListTool) {
      console.error('List tool not available globally');
      throw new Error('List tool not loaded');
    }

    console.log('Tools available:', { HeaderTool, ListTool });
    
    const editor = new EditorJS({
    holder: 'editorjs',
    placeholder: 'Let\'s write an awesome story!',
    tools: {
    header: HeaderTool,
    list: ListTool
    },
      onReady: () => {
        console.log('Editor.js is ready - hiding textarea and patching toolbar positioning');
        textarea.hide();
        
        // Patch Editor.js toolbar positioning
        patchToolbarPositioning();
      },
      onChange: async () => {
        try {
          const data = await editor.save();
          
          // Store Editor.js data in hidden field for re-editing
          let hiddenInput = $('input[name="editorjsData"]');
          if (!hiddenInput.length) {
            hiddenInput = $('<input type="hidden" name="editorjsData">');
            textarea.after(hiddenInput);
          }
          hiddenInput.val(JSON.stringify(data));
          
          // Note: No real-time JSON→MD conversion here for performance
          // Conversion happens only before form submission/validation
          
          console.log('Saved Editor.js data:', data);
        } catch (error) {
          console.error('Editor.js save error:', error);
        }
      },
      onReady: () => {
        console.log('Editor.js is ready - hiding textarea and patching toolbar positioning');
        textarea.hide();
        
        // Patch Editor.js toolbar positioning
        patchToolbarPositioning();
      },
    });

    // Load existing content if available
    const existingData = $('input[name="editorjsData"]').val();
    if (existingData) {
      try {
        editor.render(JSON.parse(existingData));
      } catch (error) {
        console.error('Editor.js render error:', error);
      }
    }

    // Hook into NodeBB's composer submission system
    console.log('🔧 Setting up NodeBB composer event handlers...');
    
    // Convert Editor.js content to markdown when submit button is clicked
    // This runs BEFORE NodeBB's validation, ensuring textarea is populated
    $('.composer-submit').off('click.editorjs').on('click.editorjs', async function(e) {
      console.log('🎯 Submit button clicked - converting Editor.js to markdown');
      
      try {
        const editorData = await editor.save();
        const markdown = convertEditorJsToMarkdown(editorData);
        textarea.val(markdown);
        console.log('✅ Pre-populated textarea with markdown:', markdown.length, 'characters');
      } catch (error) {
        console.error('❌ Submit button conversion error:', error);
      }
    });
    
    console.log('✅ NodeBB composer event handlers attached');
  } catch (error) {
    console.error('Failed to initialize Editor.js:', error);
    // Remove container and show original textarea
    editorContainer.remove();
    textarea.show();
  }
});
