/*!
 * BBH ♥ Babel Browser Harness v0.2.0
 * In-browser CDN-based ES6+ transpiling via Babel
 * Copyright (c) 2016, Michael Spencer
 * MIT License
 */
(function() {
  "use strict";

  window.bbh = new function() {
    var self = this;

    //-[ Setup ]----------------------------------------------------------------

    var VERSION = "0.2.0",
        MESSAGE_SYMBOL = "♥".length === 1 ? "♥" : "\u00B7",  // heart or middot
        MESSAGE_PREFIX = "BBH " + MESSAGE_SYMBOL + " ",
        WELCOME = MESSAGE_PREFIX + "Hello",
        ERROR_STRING = "Error Detected :(",
        COMMENT_LINE = " " + MESSAGE_PREFIX.toUpperCase() + " BELOW THIS LINE ",
        CROSS_ORIGIN_REGISTRATION_ERROR = "Cross-origin registration rejected",
        GLOBAL_START = Object.keys(window),
        IGNORE_MODULE_NAMES = [ 'bbh' ],
        DEFAULT_MODULES = [
          {
            name: 'bbh',
            exports: 'bbh',
            ignores: 'bbh',
            callNoConflict: false,
            deleteFromWindow: false,
          },
          {
            name: 'babel',
            exports: 'Babel',
            ignores: 'Babel',
            src: 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.7.7/babel.min.js',
            callNoConflict: false,
            deleteFromWindow: false,
          },
          {
            name: 'requirejs',
            ignores: ['__core-js_shared__', 'requirejs', 'require', 'define'],
            src: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js',
          },
        ],
        AUTOLOAD_MODULES = {
          "firebug-lite": {
            exports: 'Firebug',
            ignores: ['Firebug', 'XMLHttpRequest'],
            src: 'https://getfirebug.com/firebug-lite.js#startOpened',
            callNoConflict: false,
            deleteFromWindow: false,
          },
          react: {
            exports: 'React',
            src: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.2.1/react.min.js',
          },
          "react-dom": {
            depends: 'react',
            exports: 'ReactDOM',
            src: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.2.1/react-dom.min.js',
          },
        },
        REACT_MODULE_NAMES = ['react', 'react-dom'],
        REACT_PRESET_NAME = 'react',
        FIREBUG_MODULE_NAME = 'firebug-lite';

    var babelConfig = {
          presets: ['es2015'],
          plugins: [],
        },
        globalIgnores = [],
        globalLeaks = [],
        modules = [],
        autoloadedModules = {},
        executionDelays = [],
        registrations = [],
        allowCrossOriginRegistration = false,
        isRegistrationMode = false,
        removeRegisterScripts = true,
        removeModuleScripts = true,
        autoloadReact = true,
        shouldEnableFirebug = false,
        enabledFirebug = false,
        appendTarget,
        moduleEntries;

    //-[ Check for URL-hash-based Registration Mode ]---------------------------

    loadHashFlags();

    //-[ Execute On Load Complete ]---------------------------------------------

    document.addEventListener('DOMContentLoaded', loaded);
    window.addEventListener('load', loaded);

    function loaded() {
      document.removeEventListener('DOMContentLoaded', loaded);
      window.removeEventListener('load', loaded);

      // Log execution delay errors
      executionDelays = executionDelays.map(function(delay) {
        return delay.catch(function(error) {
          console.debug(MESSAGE_PREFIX + (error.message || error));
        })
      });

      Promise.all(executionDelays).then(function() {
        execute();
      });
    }

    //-[ Make exports available ]-----------------------------------------------

    defineExports();

    //-[ Enable Firebug if requested (in URL hash) ]----------------------------

    if (shouldEnableFirebug) {
      enableFirebug();
    }

    //-[ Methods ]--------------------------------------------------------------

    function defineExports() {
      // Configuration
      self.babelConfig = babelConfig;
      self.modules = modules;
      self.removeModuleScripts = removeModuleScripts;
      self.removeRegisterScripts = removeRegisterScripts;
      self.autoloadReact = autoloadReact;
      self.appendTarget = appendTarget;

      // Immutable
      self.version = VERSION;
      self.welcome = WELCOME;

      // Methods
      self.register = register;
      self.enableFirebug = enableFirebug;

      // Getters
      self.isRegistrationMode = function() { return isRegistrationMode; };

      // Setters
      self.registrationMode = function(bool) { isRegistrationMode = bool !== false; };
      self.allowCrossOriginRegistration = function(bool) { allowCrossOriginRegistration = bool !== false; }
    }

    function execute() {
      importConfig();

      if (isRegistrationMode) {
        listenForRegistrationModeWindowMessage();
        return;
      }

      console.debug(WELCOME);

      determineAutoloadModules();
      buildModuleEntries();
      determineAppendTarget();
      addCommentLine();

      logStatus("Loading Modules");
      loadExternalScripts()
        .then(loadRegistrationsAndMergeScriptsAndErrors)
        .then(mapAndTranspile)
        .then(removeRequestedElements)
        .catch(logAndThrowError);

      function loadRegistrationsAndMergeScriptsAndErrors(scriptsAndErrors) {
        // Load registrations and append elements
        if (!registrations.length) {
          return scriptsAndErrors;
        }
        return loadRegistrations().then(function(registrationScriptsAndErrors) {
          return scriptsAndErrors.concat(registrationScriptsAndErrors)
        });
      }

      function mapAndTranspile(scriptsAndErrors) {
        return new Promise(function(resolve, reject) {
          var errors = scriptsAndErrors.filter(function(_) { return isError(_) });
          if (errors.length) {
            logStatus(ERROR_STRING)
            errors.forEach(function(_) { logStatus(_.message || _) });
          } else {
            mapGlobals();
            detectLeaks();

            logStatus("Transpiling");
            transpile()
              .then(function(scripts) {
                logStatus("Running");
                return scripts;
              })
              .then(function(scripts) {
                resolve(scripts);
              })
              .catch(function(error) {
                reject(error);
              });
          }
        })
      }

      function removeRequestedElements() {
        [].slice.call(document.querySelectorAll('[data-remove="true"]') || [])
          .forEach(function(element) {
            element.remove()
          })
      }
    }

    function loadHashFlags() {
      var src, hashIndex, hash;
      if (document.currentScript) {
        src = document.currentScript.getAttribute('src');
        if (src) {
          src = decodeURI(src);
          hashIndex = src.indexOf('#');
          if (~hashIndex) {
            hash = src.substr(hashIndex + 1);

            // Process hash flags
            hash.split('|').forEach(function(_) {
              if (_) {
                _ = _.trim();

                // Split key/value around first equals (=) and assign flags
                var n = _.indexOf('='), key, value;
                _ = ~n ? [_.slice(0, n).trim(), _.slice(n + 1).trim()] : [_];

                // Parse input
                key = _[0];
                value = typeof _[1] === 'undefined' ? true
                      : _[1] === "true" ? true
                      : _[1] === "false" ? false
                      : ~_[1].indexOf(',') ? _[1].split(',').map(function(_) { return _.trim() })
                      : _[1];

                // Apply flag
                switch(key) {
                  case "registration": isRegistrationMode = ensureBoolean(value); break;
                  case "react":
                    if (ensureBoolean(value)) {
                      if (!Array.isArray(babelConfig.presets)) {
                        babelConfig.presets = [];
                      }
                      babelConfig.presets.push('react');
                    } else {
                      babelConfig.presets = (babelConfig.presets || []).filter(function(preset) { return preset !== 'react' });
                    }
                    break;
                  case "firebug": shouldEnableFirebug = ensureBoolean(value); break;
                  case "minify": // fall-through
                  case "minified": babelConfig.minified = ensureBoolean(value); break;
                  case "presets": babelConfig.presets = ensureArray(value); break;
                  case "plugins": babelConfig.plugins = ensureArray(value); break;
                }
              }
            })
          }
        }
      }
    }

    function importConfig() {
      babelConfig = self.babelConfig;
      modules = self.modules;
      removeModuleScripts = self.removeModuleScripts;
      removeRegisterScripts = self.removeRegisterScripts;
      autoloadReact = self.autoloadReact;
      appendTarget = self.appendTarget;
    }

    function determineAppendTarget() {
      appendTarget = appendTarget ||
                     document.querySelector('#bbh, #BBH, #__bbh, #__BBH') ||
                     document.body;
    }

    function addCommentLine() {
      var padLine = new Array(COMMENT_LINE.length + 1).join('-');
      appendTarget.appendChild(document.createComment(padLine));
      appendTarget.appendChild(document.createComment(COMMENT_LINE));
      appendTarget.appendChild(document.createComment(padLine));
    }

    function loadExternalScripts(){
      var urls = moduleEntries.map(function(_) { return _.src }).filter(Boolean);
      return Promise.all(urls.map(function(url) {
        return new Promise(function(resolve, reject){
          var script = document.createElement('script'),
              dataName = getUrlFilename(url);
          script.setAttribute('data-name', dataName);
          script.async = false;
          script.src = url;
          script.onload = function() {
            resolve(script);
          };
          script.onerror = function(e) {
            reject(new Error("The script \"" + (dataName || e.target.src) + "\" is not accessible"))
          }
          if (removeModuleScripts) {
            script.setAttribute('data-remove', "true");
          }
          appendTarget.appendChild(script);
        })
      }).map(function(p) {
        // catch and return errors to allow for post-processing
        return p.catch(function(error) {
          return error;
        })
      }));
    }

    /**
     * options (Object -or- Array of Objects):
     *   src (String) - Required - URL path to file
     *   timeout (Number) - Optional - Milleseconds to wait before failing
     *   messageId (String)- Optional - ID to use for message debugging
     */
    function register(options) {
      if (Array.isArray(options)) {
        options.forEach(function(_) { register(_) });
        return;
      }
      var registration = {
        src: options.src,
        timeout: typeof options.timeout === 'number' ? options.timeout : 3000,  // 3 seconds
        messageId: options.messageId || generateRandomId()
      };
      registrations.push(registration);
    }

    function loadRegistrations() {
      return Promise.all(registrations
        .map(loadRegistration)
        .map(function(p) {
          // catch and return errors to allow for post-processing
          return p.catch(function(error) {
            return error;
          })
        })
      ).then(function(elementsAndErrors) {
        // flatten results
        var result = [];
        elementsAndErrors.forEach(function(_) {
          [].push[Array.isArray(_) ? 'apply' : 'call'](result, _)
        });
        return result;
      });

      function loadRegistration(registration) {
        var iframe = createIframe(registration.src),
            promises = [
              listenForWindowMessage(iframe, registration),
              listenForIframeLoad(iframe, registration)
            ],
            promiseTimer = new Promise(function(resolve, reject) {
              var timer = setTimeout(function() {
                reject(new Error('Registration didn\'t resolve: "' + registration.src + '" (' + registration.timeout + 'ms)'));
              }, registration.timeout);
              Promise.all(promises)
                .then(function() {
                  clearTimeout(timer);
                  resolve();
                }, function(error) {
                  // Ignore errors in timer
                });
            }),
            result = Promise.all(promises.concat([promiseTimer]))
              .then(function(_) {
                // Resolve with the script tags from the window message event
                return _[0];
              });
        appendTarget.appendChild(iframe);
        return result;
      }

      function createIframe(src) {
        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.setAttribute('style', "display:none");
        return iframe;
      }

      function listenForIframeLoad(iframe, registration) {
        return new Promise(function(resolve, reject) {
          iframe.onload = onLoad;

          function onLoad() {
            var data = { id: registration.messageId };
            iframe.contentWindow.postMessage(data, '*');
            resolve();
          }
        });
      }

      function listenForWindowMessage(iframe, registration) {
        return new Promise(function(resolve, reject){
          window.addEventListener('message', onMessage);

          function onMessage(event) {
            if (event.data.id === registration.messageId) {
              if (event.data.error) {
                reject(new Error(event.data.error + ' (' + registration.src + ')'));
              } else if (event.origin === document.origin || allowCrossOriginRegistration) {
                window.removeEventListener('message', onMessage);
                processMessageData(event.data);
              } else {
                reject(new Error(CROSS_ORIGIN_REGISTRATION_ERROR + ' (' + registration.src + ')'))
              }
              iframe.remove();
            }
          }

          // Promise resolution happens in here
          function processMessageData(data) {
            try {
              if (Array.isArray(data.scripts)) {
                resolve(data.scripts
                  .map(deserializeScript)
                  .map(function(_) {
                    appendTarget.appendChild(_);
                    return _;
                  })
                );
              } else {
                resolve([]);
              }
            } catch (error) {
              reject(error);
            }
          }

          function deserializeScript(script) {
            var result = document.createElement('script');
            result.setAttribute('type', "text/babel");
            if (script.name) {
              result.setAttribute('data-name', script.name)
            }
            if (script.src) {
              result.setAttribute('data-src', script.src)
            } else if (script.textContent) {
              result.textContent = script.textContent;
            }
            result.setAttribute('data-register-src', registration.src);
            if (removeRegisterScripts) {
              result.setAttribute('data-remove', "true");
            }
            return result;
          }
        });
      }
    }

    function listenForRegistrationModeWindowMessage() {
      window.addEventListener('message', registrationModeOnMessage);

      function registrationModeOnMessage(event) {
        if (isRegistrationMode && event.data.id) {
          if (event.origin === document.origin || allowCrossOriginRegistration) {
            var scripts = [].slice.call(document.querySelectorAll('script[type="text/babel"]') || []);
            event.source.postMessage({
              id: event.data.id,
              scripts: scripts.map(serializeScript)
            }, '*');
          } else {
            event.source.postMessage({
              id: event.data.id,
              error: CROSS_ORIGIN_REGISTRATION_ERROR
            }, '*');
          }
        }
        window.removeEventListener('message', registrationModeOnMessage);

        function serializeScript(script) {
          var result = {},
              name = script.getAttribute('data-name') || script.getAttribute('name'),
              src = script.getAttribute('data-src') || script.getAttribute('src'),
              textContent = script.textContent;
          if (name) {
            result.name = name;
          }
          if (src) {
            result.src = src;
          } else {
            result.textContent = textContent;
          }
          return result;
        }
      }
    }

    /**
     * Transforms an existing module object into a full module entry with the
     * expected properties and types.
     */
    function createModuleEntry(moduleName, moduleObject) {
      return {
        name: moduleName || moduleObject.name || null,
        src: moduleObject.src || null,
        depends: ensureArray(moduleObject.depends || []),
        exports: ensureArray(moduleObject.exports || []),
        ignores: ensureArray(moduleObject.ignores || []),
        callNoConflict: ensureBoolean(moduleObject.callNoConflict, true),
        deleteFromWindow: ensureBoolean(moduleObject.deleteFromWindow, true),
      }
    }

    function determineAutoloadModules() {
      // Firebug
      if (enabledFirebug) {
        // Firebug is loaded immediately, so we don't need the src property
        var firebugModuleObject = AUTOLOAD_MODULES[FIREBUG_MODULE_NAME],
            moduleObject = {};
        Object.keys(firebugModuleObject)
          .filter(function(key) { return key !== 'src' })
          .forEach(function(key) { moduleObject[key] = firebugModuleObject[key] });
        autoloadedModules[FIREBUG_MODULE_NAME] = createModuleEntry(FIREBUG_MODULE_NAME, moduleObject);
      }

      // React Preset
      if (autoloadReact &&
          babelConfig &&
          babelConfig.presets &&
          ~babelConfig.presets.indexOf(REACT_PRESET_NAME)
      ) {
        if (!anyModulesAreInModules(REACT_MODULE_NAMES, modules)) {
          REACT_MODULE_NAMES.forEach(function(moduleName) {
            autoloadedModules[moduleName] = createModuleEntry(moduleName, AUTOLOAD_MODULES[moduleName]);
          })
        }
      }
    }

    /** Returns true if any of the moduleNames are defined in the modules. */
    function anyModulesAreInModules(moduleNames, modules) {
      for (var i = 0, j = moduleNames.length; i < j; i++) {
        if (moduleIsInModules(moduleNames[i], modules)) {
          return true;
        }
      }
      return false;
    }

    /** Returns true if the moduleName is defined in the modules. */
    function moduleIsInModules(moduleName, modules) {
      var result;
      if (Array.isArray(modules)) {
        result = false;
        for (var i = 0, j = modules.length; i < j; i++) {
          if (modules[i].name === moduleName) {
            result = true;
            break;
          }
        }
      } else {
        result = !!~Object.keys(modules).indexOf(moduleName);
      }
      return result;
    }

    function buildModuleEntries() {
      var sort = loadDependencySorter()({ idProperty: 'name', defaultWeight: -1 }).sort,
          result;

      // Create module entries
      result = [modules, autoloadedModules]
        .reduce(function(result, moduleObjects) {
          var previousModuleName;
          if (Array.isArray(moduleObjects)) {
            // Process array
            moduleObjects.forEach(function(moduleObject, index) {
              // Filter out disallowed modules
              if (!moduleObject.name || ~IGNORE_MODULE_NAMES.indexOf(moduleObject.name)) {
                return;
              }
              var moduleEntry = createModuleEntry(moduleObject.name, moduleObject);
              if (previousModuleName && !~moduleEntry.depends.indexOf(previousModuleName)) {
                // Make each item depend on the previous one to retain array
                // order during the dependency sort.
                moduleEntry.depends.push(previousModuleName);
              }
              result.push(moduleEntry);
              previousModuleName = moduleEntry.name;
            })
          } else {
            // Process keys
            Object.keys(moduleObjects).forEach(function(moduleName) {
              // Filter out disallowed modules
              if (!moduleName || ~IGNORE_MODULE_NAMES.indexOf(moduleName)) {
                return;
              }
              result.push(createModuleEntry(moduleName, moduleObjects[moduleName]));
            })
          }
          return result;
        }, []);

      // Sort module entries by dependency
      result = sort(result);

      // Append default module entries
      DEFAULT_MODULES.forEach(function(moduleObject) {
        // If module was already defined, move it to the end of the list to
        // retain default position.
        for (var i = result.length - 1; i >= 0; i--) {
          if (result[i].name === moduleObject.name) {
            result.push(result.splice(i, 1)[0]);
            return;
          }
        }
        result.push(createModuleEntry(moduleObject.name, moduleObject));
      });

      moduleEntries = result;
console.log(moduleEntries.map(function(_) { return _.name+' '+JSON.stringify(_.depends) }));
    }

    function mapGlobals() {
      moduleEntries.forEach(mapGlobal);

      function mapGlobal(_) {
        _ = {
          name: _.name,
          exports: [].concat(_.exports || []),
          ignores: [].concat(_.ignores || []),
          callNoConflict: typeof _.callNoConflict === 'undefined' || !!_.callNoConflict,
          deleteFromWindow: typeof _.deleteFromWindow === 'undefined' || !!_.deleteFromWindow
        };
        var matchedExports = _.exports.filter(function(k) { return window.hasOwnProperty(k) });
        if (_.name) {
          if (matchedExports.length) {
            _.exported = window[matchedExports[0]];
            (function(_) {
              define(_.name, function(require, exports, module) {
                module.exports = _.exported;
              });
              require([_.name]);
              if (_.callNoConflict && _.exported && typeof _.exported.noConflict === 'function') {
                _.exported.noConflict();
              }
              if (_.deleteFromWindow) {
                _.exports.forEach(function(k) {
                  if (window.hasOwnProperty(k)) {
                    delete window[k];
                  }
                })
              }
            })(_);
          } else {
            // Dummy definition
            define(_.name, function() { return null });
            require([_.name]);
          }
        }
        [].push.apply(globalIgnores, _.ignores);
      }
    }

    function detectLeaks() {
      globalLeaks = Object.keys(window).filter(function(k) { return !~GLOBAL_START.concat(globalIgnores).indexOf(k) });
      if (globalLeaks.length) {
        console.debug(MESSAGE_PREFIX + "Global Leak" + (globalLeaks.length > 1 ? "s" : "") + " Detected: " + JSON.stringify(globalLeaks))
      }
    }

    function enableFirebug(url) {
      if (enabledFirebug) { return }

      enabledFirebug = true;
      url = url || AUTOLOAD_MODULES[FIREBUG_MODULE_NAME].src;
      loadScriptAndDelayExecution(url, onLoad, onError);

      function onLoad(event, resolve, reject) {
        resolve();
      }

      function onError(event, resolve, reject) {
        enabledFirebug = false;
        reject(new Error("Unable to load Firebug"));
      }
    }

    function loadScriptAndDelayExecution(url, onLoad, onError) {
      if (url) {
        // Load config details up to this point
        importConfig();

        executionDelays.push(new Promise(function(resolve, reject) {
          var script = document.createElement('script'),
              dataName = getUrlFilename(url);
          if (dataName) {
            script.setAttribute('data-name', dataName);
          }
          script.async = false;
          script.src = url;
          script.onload = function(event) {
            if (typeof onLoad === 'function') {
              onLoad(event, resolve, reject);
            } else {
              resolve();
            }
          };
          script.onerror = function(event) {
            if (typeof onError === 'function') {
              onError(event, resolve, reject);
            } else {
              reject(new Error("Unable to load script: " + (dataName || url)));
            }
          };
          if (removeModuleScripts) {
            script.setAttribute('data-remove', "true");
          }
          document.head.appendChild(script);
        }));
      }
    }

    function transpile() {
      return new Promise(function(resolve, reject) {
        try {
          require(['babel'], function(Babel) {
            var modulePrefix = "__bbh_", moduleIndex = 0;

            Promise.resolve([].slice.call(document.querySelectorAll('script[type="text/babel"]') || []))
              .then(function(_) { return Promise.all(_.map(extractWithName)) })
              .then(function(_) { return Promise.all(_.map(transformWithName)) })
              .then(function(_) { return Promise.all(_.map(wrapWithName)) })
              .then(function(_) { return Promise.all(_.map(buildWithName)) })
              .then(function(_) { return Promise.all(_.map(runWithName)) })
              .then(function(_) { resolve(_) })
              .catch(function(error) { reject(error) });

            function extract(element) { var src = element.getAttribute('data-src') || element.getAttribute('src'); return src ? fetch(src).then(function(res) { return res.text() }).then(function(text) { return text }) : Promise.resolve(element.textContent) }
            function transform(script) { return Babel.transform(script, babelConfig).code }
            function wrap(name, script) { return ";define('" + name + "', function(require, exports, module) { try {" + script + "\n; } catch (error) { console.debug('" + MESSAGE_PREFIX + ERROR_STRING + "'); throw error }}); require(['" + name + "']);" }
            function build(script) { var element = document.createElement('script'); element.async = false; element.textContent = script; return element }
            function run(element) { appendTarget.appendChild(element); return element }

            function extractWithName(element) { return extract(element).then(function(text) { return [element.getAttribute('data-name') || element.getAttribute('name') || element.getAttribute('data-src') || element.getAttribute('src') || modulePrefix + (++moduleIndex), text] }) }
            function transformWithName(nameAndScript) { return [nameAndScript[0], transform(nameAndScript[1])] }
            function wrapWithName(nameAndScript) { return [nameAndScript[0], wrap.apply(null, nameAndScript)] }
            function buildWithName(nameAndScript) { var name = nameAndScript[0], built = build(nameAndScript[1]); if (name) { built.setAttribute('data-name', name) } return [name, built] }
            function runWithName(nameAndElement) { return [nameAndElement[0], run(nameAndElement[1])] }
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    function logStatus(message) {
      console.debug(MESSAGE_PREFIX + message);
    }

    function logAndThrowError(error) {
      logStatus(ERROR_STRING);
      if (isError(error)) {
        throw error;
      } else {
        throw new Error(error && error.message || error || "An unknown error occurred")
      }
    }

    function getUrlFilename(url) {
      return url.substr((url.lastIndexOf('/') || -1) + 1).split('#')[0];
    }

    function ensureArray(o) {
      return Array.isArray(o) ? o : [o];
    }

    function ensureBoolean(o, defaultValue) {
      return typeof o === 'boolean' ? o : !!defaultValue
    }

    function isError(o) {
      return o && typeof o === 'object' && (
               Object.prototype.toString(o) === '[object Error]' ||
               (o.name === 'Error' && typeof o.message === 'string')
             );
    }

    function generateRandomId() {
      var min = 1, max = 999999999;
      return '' + (Math.floor(Math.random() * (max - min + 1)) + min);
    }

    function loadDependencySorter() {
      return function(define, module) {
        /*! Dependency Sorter v0.1.0 | (c) Michael Spencer | MIT License | https://github.com/codewithmichael/dependency-sorter */
        "use strict";!function(e,n,r,t){var i;"function"==typeof define&&define.amd?define(r,[],t):"object"==typeof module&&module.exports?module.exports=t():(i=e[n],e[n]=t(),e[n].noConflict=function(){var r=e[n];return e[n]=i,r})}(this,"DependencySorter","dependency-sorter",function(){function e(e){function i(e){function n(){e=e.map(u.serialize)}function i(){e=e.map(u.deserialize)}function o(){e=r(e)}function f(){t(e)}return n(),o(),f(),i(),e}var u=new n(e);return{sort:i,util:{serialize:function(e){return u.serialize(e)},deserialize:function(e){return u.deserialize(e)},Serializer:n,sortByDepends:r,sortByWeight:t}}}function n(e){function n(e){var n=e[i],r=e[u],f=e[o];return{id:"undefined"!=typeof n&&null!=n?n:e,weight:"number"==typeof r?r:t,depends:f?Array.isArray(f)?f:[f]:[],mark:void 0,node:e}}function r(e){return e.node}var t=e&&"number"==typeof e.defaultWeight?e.defaultWeight:0,i=e&&e.idProperty||"id",u=e&&e.weightProperty||"weight",o=e&&e.dependsProperty||"depends";return{serialize:n,deserialize:r}}function r(e){function n(u){switch(u.mark){case r:throw new Error("Circular dependency encountered: "+u.id);case t:break;default:u.mark=r,e.forEach(function(e){~e.depends.indexOf(u.id)&&n(e)}),u.mark=t,i.unshift(u)}}var r=1,t=2,i=[];return e.forEach(function(e){e.mark||n(e)}),i}function t(e){var n=e;return i(n,1,n.length,function(e,n,r){if(e.weight<0){var t;t=u(r,n,0,function(e,n){return!~e.depends.indexOf(n.id)}),t=u(r,t,n,function(e,n){return e.weight>n.weight})}}),i(n,n.length-2,0,function(e,n,r){if(e.weight>0){var t;t=u(r,n,r.length-1,function(e,n){return!~n.depends.indexOf(e.id)}),t=u(r,t,n,function(e,n){return e.weight<n.weight})}}),n}function i(e,n,r,t,i){if(n!==r){for(var u=r>n?1:-1,o=n;o!==r;o+=u){var f=t(e[o],o,e,n,r,t,i);if("undefined"!=typeof f)return f}return i}}function u(e,n,r,t){if(n!==r){var u=r>n?1:-1;return i(e,n,r,function(e,n,i){var o=n+u,f=i[o];return t(e,f)?(i[o]=e,i[n]=f,o===r?o:void 0):n},n)}}return e.util={Serializer:n,sortByDepends:r,sortByWeight:t},e});
        return this.DependencySorter.noConflict();
      }.call({}, undefined, undefined);
    }
  }
}).call(this);
