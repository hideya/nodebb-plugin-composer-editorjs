// Convert Editor.js data to markdown
function convertEditorJsToMarkdown(data) {
  if (!data || !Array.isArray(data.blocks)) return '';

  return data.blocks.map(block => {
    const { type, data } = block;
    switch (type) {
      case 'paragraph':
        return `${data.text}\n`;
      case 'header':
        return `${'#'.repeat(data.level)} ${data.text}\n`;
      case 'list':
        return convertListToMarkdown(data, 0);
      default:
        return `${data.text || ''}\n`;
    }
  }).join('\n');
}

// Helper function to convert List 2.0 format to markdown (client-side)
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

// Load Editor.js scripts dynamically with better error handling
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
  console.log('Found textarea:', textarea.length);
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
      onChange: async () => {
        try {
          const data = await editor.save();
          
          // Store Editor.js data in hidden field
          let hiddenInput = $('input[name="editorjsData"]');
          if (!hiddenInput.length) {
            hiddenInput = $('<input type="hidden" name="editorjsData">');
            textarea.after(hiddenInput);
          }
          hiddenInput.val(JSON.stringify(data));
          
          // Convert to markdown and put in original textarea for validation
          const markdown = convertEditorJsToMarkdown(data);
          textarea.val(markdown);
          
          console.log('Saved Editor.js data and converted to markdown:', markdown);
        } catch (error) {
          console.error('Editor.js save error:', error);
        }
      },
      onReady: () => {
        console.log('Editor.js is ready - hiding textarea');
        textarea.hide();
      }
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

    // Ensure content is converted on form submission
    const form = textarea.closest('form');
    if (form.length) {
      form.on('submit', async function(e) {
        try {
          const data = await editor.save();
          const markdown = convertEditorJsToMarkdown(data);
          textarea.val(markdown);
          console.log('Form submit: Updated textarea with markdown:', markdown);
        } catch (error) {
          console.error('Form submit conversion error:', error);
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize Editor.js:', error);
    // Remove container and show original textarea
    editorContainer.remove();
    textarea.show();
  }
});
