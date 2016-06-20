/**
BBH ♥ Babel Browser Harness
In-browser CDN-based ECMAScript transpiling via Babel
Copyright (c) 2016, Michael Spencer
MIT License
*/
;(function() {
  "use strict";

  window.bbh = new function() {
    self = this;

    //-[ Setup ]----------------------------------------------------------------

    var messagePrefix = "BBH ♥ ",
        welcome = messagePrefix + "Hello",
        errorString = "Error Detected :(",
        commentLine = " BBH ♥ BELOW THIS LINE ",
        globalStart = Object.keys(window),
        globalIgnores = [],
        globalLeaks = [],
        defaultModules = [
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
        ],
        modules = [],
        babelConfig = {
          presets: ['es2015'],
          plugins: [],
        },
        removeModuleScripts = true,
        appendTarget,
        moduleEntries;

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
      console.debug(welcome);
      buildModuleEntries();
      determineAppendTarget();
      addCommentLine();

      logStatus("Loading Modules");
      loadScripts().then(mapAndTranspile, logError);

      function mapAndTranspile(loadedScripts) {
        var errors = loadedScripts.filter(function(_) { return isError(_) });
        if (errors.length) {
          logStatus(errorString)
          errors.forEach(function(_) { logStatus(_.message || _) });
        } else {
          mapGlobals();
          detectLeaks();

          logStatus("Transpiling");
          transpile().then(function(scripts) {
            logStatus("Running");
            return scripts;
          }, function(error) {
            logError(error)
          });
        }
      }

      function logStatus(message) {
        console.debug(messagePrefix + message);
      }

      function logError(error) {
        logStatus(errorString);
        if (isError(error)) {
          throw error;
        } else {
          throw new Error(error && error.message || error || "An unknown error occurred")
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
      var padLine = new Array(commentLine.length + 1).join('-');
      appendTarget.appendChild(document.createComment(padLine));
      appendTarget.appendChild(document.createComment(commentLine));
      appendTarget.appendChild(document.createComment(padLine));
    }

    function loadScripts(){
      var urls = moduleEntries.map(function(_) { return _.src }).filter(Boolean);
      return Promise.all(urls.map(function(url) {
        return new Promise(function(resolve, reject){
          var script = document.createElement('script'),
              dataName = url.substr((url.lastIndexOf('/') || -1) + 1);
          script.setAttribute('data-name', dataName);
          script.async = false;
          script.src = url;
          script.onload = function() { resolve(script) };
          script.onerror = function(e) {
            reject(new Error("The script \"" + (dataName || e.target.src) + "\" is not accessible"))
          }
          appendTarget.appendChild(script);
          if (removeModuleScripts) {
            setTimeout(function() {
              script.remove();
            }, 0);
          }
        })
      }).map(function(p) {
        // catch and return errors to allow for processing
        return p.catch(function(error) {
          return error;
        })
      }));
    }

    function buildModuleEntries() {
      var result = [];
      [modules, defaultModules].forEach(function(_) {
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
      globalLeaks = Object.keys(window).filter(function(k) { return !~globalStart.concat(globalIgnores).indexOf(k) });
      if (globalLeaks.length) {
        console.debug(messagePrefix + "Global Leak" + (globalLeaks.length > 1 ? "s" : "") + " Detected: " + JSON.stringify(globalLeaks))
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
            function wrap(name, script) { return ";define('" + name + "', function(require, exports, module) { try {" + script + "\n; } catch (error) { console.debug('" + messagePrefix + "' + 'Error Detected :('); throw error }}); require(['" + name + "']);" }
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
             )
    }

    //-[ Exports ]--------------------------------------------------------------

    self.babelConfig = babelConfig;
    self.modules = modules;
    self.removeModuleScripts = removeModuleScripts;
    self.appendTarget = appendTarget;

    // Immutable
    self.welcome = welcome;
  }
})();
