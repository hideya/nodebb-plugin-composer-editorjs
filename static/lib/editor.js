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
        return data.items.map((item, i) => {
          const bullet = data.style === 'ordered' ? `${i + 1}.` : '-';
          return `${bullet} ${item}`;
        }).join('\n') + '\n';
      default:
        return `${data.text || ''}\n`;
    }
  }).join('\n');
}

// Load Editor.js scripts dynamically with better error handling
function loadEditorJSScripts() {
  return new Promise((resolve, reject) => {
    if (typeof EditorJS !== 'undefined') {
      resolve();
      return;
    }

    // Load Editor.js core and essential tools
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.26.5/dist/editor.min.js',
      'https://cdn.jsdelivr.net/npm/@editorjs/header@latest/dist/bundle.js',
      'https://cdn.jsdelivr.net/npm/@editorjs/list@latest/dist/bundle.js',
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
          resolve();
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
    const editor = new EditorJS({
      holder: 'editorjs',
      placeholder: 'Let\'s write an awesome story!',
      tools: {
        header: Header,
        list: List
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
