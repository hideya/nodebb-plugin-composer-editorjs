<div class="acp-page-container">
  <div component="settings/main" class="row settings-header">
    <div class="col-sm-12">
      <nav class="section-breadcrumbs">
        <ol class="breadcrumb">
          <li><a href="/admin">[[admin/menu:section-general]]</a></li>
          <li><a href="/admin/plugins">[[admin/menu:plugins]]</a></li>
          <li class="active">Editor.js Composer</li>
        </ol>
      </nav>
      
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">
            <i class="fa fa-edit"></i> Editor.js Composer Settings
          </h3>
        </div>
        
        <div class="panel-body">
          <form role="form" class="editorjs-settings">
            <div class="row">
              <div class="col-lg-9">
                
                <!-- General Settings -->
                <div class="panel panel-default">
                  <div class="panel-heading">
                    <h4 class="panel-title">General Settings</h4>
                  </div>
                  <div class="panel-body">
                    
                    <div class="form-group">
                      <label for="enabled">
                        <strong>Enable Editor.js</strong>
                      </label>
                      <div class="checkbox">
                        <label>
                          <input type="checkbox" id="enabled" name="enabled" {{{ if enabled }}}checked{{{ end }}}>
                          Enable the Editor.js composer (requires page reload)
                        </label>
                      </div>
                      <p class="help-block">
                        When disabled, users will see the default markdown composer.
                      </p>
                    </div>

                    <div class="form-group">
                      <label for="placeholder">
                        <strong>Editor Placeholder Text</strong>
                      </label>
                      <input type="text" class="form-control" id="placeholder" name="placeholder" 
                             value="{placeholder}" placeholder="Let's write an awesome story!">
                      <p class="help-block">
                        The placeholder text shown in the editor when it's empty.
                      </p>
                    </div>

                    <div class="form-group">
                      <label for="debugMode">
                        <strong>Debug Mode</strong>
                      </label>
                      <div class="checkbox">
                        <label>
                          <input type="checkbox" id="debugMode" name="debugMode" {{{ if debugMode }}}checked{{{ end }}}>
                          Enable debug logging in browser console
                        </label>
                      </div>
                      <p class="help-block">
                        Useful for troubleshooting. Disable in production for better performance.
                      </p>
                    </div>

                  </div>
                </div>

                <!-- Save Button -->
                <button type="button" class="btn btn-primary" id="save">Save Settings</button>
                <button type="button" class="btn btn-default" id="reset">Reset to Defaults</button>

              </div>

              <!-- Sidebar -->
              <div class="col-lg-3">
                <div class="panel panel-default">
                  <div class="panel-heading">
                    <h4 class="panel-title">Plugin Information</h4>
                  </div>
                  <div class="panel-body">
                    <p><strong>Version:</strong> 0.1.0</p>
                    <p><strong>Author:</strong> hideya kawahara</p>
                    <p><strong>License:</strong> MIT</p>
                    
                    <hr>
                    
                    <h5>Requirements</h5>
                    <ul class="list-unstyled">
                      <li>✅ NodeBB 3.0.0+</li>
                      <li>✅ Default Composer Plugin</li>
                      <li>✅ Modern Browser</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
$(document).ready(function() {
  require(['settings'], function(Settings) {
    Settings.load('composer-editorjs', $('.editorjs-settings'));

    $('#save').on('click', function() {
      Settings.save('composer-editorjs', $('.editorjs-settings'), function() {
        app.alert({
          type: 'success',
          alert_id: 'composer-editorjs-saved',
          title: 'Settings Saved',
          message: 'Editor.js composer settings have been saved successfully!',
          timeout: 2500
        });
      });
    });

    $('#reset').on('click', function() {
      bootbox.confirm('Are you sure you want to reset all settings?', function(confirm) {
        if (confirm) {
          Settings.reset('composer-editorjs', $('.editorjs-settings'), function() {
            app.alert({
              type: 'info',
              alert_id: 'composer-editorjs-reset',
              title: 'Settings Reset',
              message: 'All settings have been reset to default values.',
              timeout: 2500
            });
          });
        }
      });
    });
  });
});
</script>
