/*!
 * BBH ♥ Babel Browser Harness v0.1.0
 * In-browser CDN-based ES6+ transpiling via Babel
 * Copyright (c) 2016, Michael Spencer
 * MIT License
 */
(function() {
  "use strict";

  window.bbh = new function() {
    self = this;

    //-[ Setup ]----------------------------------------------------------------

    var MESSAGE_SYMBOL = "♥".length === 1 ? "♥" : "\u00B7",  // heart or middot
        MESSAGE_PREFIX = "BBH " + MESSAGE_SYMBOL + " ",
        WELCOME = MESSAGE_PREFIX + "Hello",
        ERROR_STRING = "Error Detected :(",
        COMMENT_LINE = " " + MESSAGE_PREFIX.toUpperCase() + " BELOW THIS LINE ",
        CROSS_ORIGIN_REGISTRATION_ERROR = "Cross-origin registration rejected",
        GLOBAL_START = Object.keys(window),
        DEFAULT_MODULES = [
          {
            name: 'bbh',
            exports: 'bbh'
          },
          {
            name: 'babel',
            exports: 'Babel',
            src: 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.7.7/babel.min.js'
          },
          {
            name: 'requirejs',
            ignores: ['__core-js_shared__', 'requirejs', 'require', 'define'],
            src: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js'
          },
        ];

    var babelConfig = {
          presets: ['es2015'],
          plugins: [],
        },
        globalIgnores = [],
        globalLeaks = [],
        modules = [],
        registrations = [],
        allowCrossOriginRegistration = false,
        isRegistrationMode = false,
        removeRegisterScripts = true,
        removeModuleScripts = true,
        appendTarget,
        moduleEntries;

    //-[ Check for URL-hash-based Registration Mode ]---------------------------

    loadRegistrationModeFromUrlHash();

    //-[ Execute On Load Complete ]---------------------------------------------

    document.addEventListener('DOMContentLoaded', loaded);
    window.addEventListener('load', loaded);

    function loaded() {
      document.removeEventListener('DOMContentLoaded', loaded);
      window.removeEventListener('load', loaded);
      execute();
    }

    //-[ Methods ]--------------------------------------------------------------

    function execute() {
      importConfig();

      if (isRegistrationMode) {
        listenForRegistrationModeWindowMessage();
        return;
      }

      console.debug(WELCOME);

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
    }

    function loadRegistrationModeFromUrlHash() {
      var src, hashIndex, hash;
      if (document.currentScript) {
        src = document.currentScript.getAttribute('src');
        if (src) {
          hashIndex = src.indexOf('#');
          if (~hashIndex) {
            hash = src.substr(hashIndex + 1);
            if (hash === 'registration') {
              isRegistrationMode = true;
            }
          }
        }
      }
    }

    function importConfig() {
      babelConfig = self.babelConfig;
      modules = self.modules;
      removeModuleScripts = self.removeModuleScripts;
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
              dataName = url.substr((url.lastIndexOf('/') || -1) + 1);
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
              result.setAttribute('name', script.name)
            }
            if (script.src) {
              result.setAttribute('src', script.src)
            } else if (script.textContent) {
              result.textContent = script.textContent;
            }
            result.setAttribute('data-src', registration.src);
            if (removeModuleScripts) {
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
              name = script.getAttribute('name'),
              src = script.getAttribute('src'),
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

    function buildModuleEntries() {
      var result = [];
      [modules, DEFAULT_MODULES].forEach(function(_) {
        if (Array.isArray(_)) {
          [].push.apply(result, _);
        } else {
          Object.keys(_).forEach(function(k) { result.push(Object.assign({}, _[k], { name: k })) })
        }
      });
      moduleEntries = result;
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

    function transpile() {
      return new Promise(function(resolve, reject) {
        try {
          require(['babel'], function(Babel) {
            var moduleNames = [], modulePrefix = "__bbh_", moduleIndex = 0;

            Promise.resolve([].slice.call(document.querySelectorAll('script[type="text/babel"]') || []))
              .then(function(_) { return Promise.all(_.map(extractWithName)) })
              .then(function(_) { return Promise.all(_.map(transformWithName)) })
              .then(function(_) { return Promise.all(_.map(wrapWithName)) })
              .then(function(_) { return Promise.all(_.map(buildWithName)) })
              .then(function(_) { return Promise.all(_.map(runWithName)) })
              .then(function(_) { resolve(_) })
              .catch(function(error) { reject(error) });

            function extract(element) { return element.src ? fetch(element.src).then(function(res) { return res.text() }).then(function(text) { return text }) : Promise.resolve(element.textContent) }
            function transform(script) { return Babel.transform(script, babelConfig).code }
            function wrap(name, script) { return ";define('" + name + "', function(require, exports, module) { try {" + script + "\n; } catch (error) { console.debug('" + MESSAGE_PREFIX + ERROR_STRING + "'); throw error }}); require(['" + name + "']);" }
            function build(script) { var element = document.createElement('script'); element.async = false; element.textContent = script; return element }
            function run(element) { appendTarget.appendChild(element); return element }

            function extractWithName(element) { return extract(element).then(function(text) { return [element.getAttribute('name') || element.getAttribute('src') || modulePrefix + (++moduleIndex), text] }) }
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

    //-[ Exports ]--------------------------------------------------------------

    // Configuration
    self.babelConfig = babelConfig;
    self.modules = modules;
    self.removeModuleScripts = removeModuleScripts;
    self.removeRegisterScripts = removeRegisterScripts;
    self.appendTarget = appendTarget;

    // Immutable
    self.welcome = WELCOME;

    // Methods
    self.register = register;

    // Getters
    self.isRegistrationMode = function() { return isRegistrationMode; };

    // Setters
    self.registrationMode = function(bool) { isRegistrationMode = bool !== false; };
    self.allowCrossOriginRegistration = function(bool) { allowCrossOriginRegistration = bool !== false; }
  }
})();
