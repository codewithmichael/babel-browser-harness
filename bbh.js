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

    var welcome = "BBH ♥ Hello",
        commentLine = " BBH ♥ BELOW THIS LINE ",
        globalStart = Object.keys(window),
        globalIgnores = [],
        globalLeaks = [],
        requiredScriptUrls = [
          'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.7.7/babel.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js',
        ],
        defaultMapping = [
          { name: 'bbh',       exports: 'bbh' },
          { name: 'babel',     exports: 'Babel'},
          { name: 'requirejs', ignores: ['__core-js_shared__', 'requirejs', 'require', 'define'] },
        ],
        babelConfig = {
          presets: ['es2015'],
          plugins: [],
        };

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
      console.debug(welcome);
      addCommentLine();
      loadScripts().then(function(_) {
        mapGlobals();
        detectLeaks();
        transpile();
        console.debug("BBH ♥ Complete");
      });
    }

    function addCommentLine() {
      var padLine = new Array(commentLine.length + 1).join('-');
      document.body.appendChild(document.createComment(padLine));
      document.body.appendChild(document.createComment(commentLine));
      document.body.appendChild(document.createComment(padLine));
    }

    function loadScripts(){
      return Promise.all(requiredScriptUrls.map(function(url) {
        return new Promise(function(resolve){
          var script = document.createElement('script');
          script.setAttribute('data-name', url.substr((url.lastIndexOf('/') || -1) + 1));
          script.async = false;
          script.src = url;
          script.onload = function() { resolve(script) }
          document.body.appendChild(script);
          setTimeout(function() {
            script.remove();
          }, 0);
        })
      }));
    }

    function mapGlobals() {
      defaultMapping.forEach(function(_) {
        _ = {
          name: _.name,
          exports: [].concat(_.exports || []),
          ignores: [].concat(_.ignores || []),
          callNoConflict: typeof _.callNoConflict === 'undefined' || !!_.callNoConflict,
          deleteFromWindow: typeof _.deleteFromWindow === 'undefined' || !!_.deleteFromWindow
        };
        if (_.exports.length && window.hasOwnProperty(_.exports[0])) {
          _.exported = window[_.exports[0]];
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
        }
        [].push.apply(globalIgnores, _.ignores);
      });
    }

    function detectLeaks() {
      globalLeaks = Object.keys(window).filter(function(k) { return !~globalStart.concat(globalIgnores).indexOf(k) });
      if (globalLeaks.length) {
        console.debug("BBH ♥ Global Leak" + (globalLeaks.length > 1 ? "s" : "") + " Detected: " + globalLeaks.join(', '))
      }
    }

    function transpile() {
      require(['babel'], function(Babel) {
        var moduleNames = [], modulePrefix = "__bbh_", moduleIndex = 0;

        Promise.resolve([].slice.call(document.querySelectorAll('script[type="text/babel"]') || []))
          .then(function(_) { return Promise.all(_.map(extractWithName)) })
          .then(function(_) { return Promise.all(_.map(transformWithName)) })
          .then(function(_) { return Promise.all(_.map(wrapWithName)) })
          .then(function(_) { return Promise.all(_.map(buildWithName)) })
          .then(function(_) { return Promise.all(_.map(runWithName)) });

        function extract(element) { return element.src ? fetch(element.src).then(function(res) { return res.text() }).then(function(text) { return text }) : Promise.resolve(element.textContent) }
        function transform(script) { return Babel.transform(script, babelConfig).code }
        function wrap(name, script) { return ";define('" + name + "', function(require, exports, module) {" + script + "\n;}); require(['" + name + "']);" }
        function build(script) { var element = document.createElement('script'); element.textContent = script; return element }
        function run(element) { document.body.appendChild(element); return element }

        function extractWithName(element) { return extract(element).then(function(text) { return [element.getAttribute('name') || element.getAttribute('src') || modulePrefix + (++moduleIndex), text] }) }
        function transformWithName(nameAndScript) { return [nameAndScript[0], transform(nameAndScript[1])] }
        function wrapWithName(nameAndScript) { return [nameAndScript[0], wrap.apply(null, nameAndScript)] }
        function buildWithName(nameAndScript) { var name = nameAndScript[0], built = build(nameAndScript[1]); if (name) { built.setAttribute('data-name', name) } return [name, built] }
        function runWithName(nameAndElement) { return [nameAndElement[0], run(nameAndElement[1])] }
      });
    }

    //-[ Exports ]--------------------------------------------------------------

    self.welcome = welcome;
  }
})();
