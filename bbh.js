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

    var oldOnload = document.body.onload;
    document.body.onload = function() {
      if (typeof oldOnload === 'function') {
        oldOnload.call(this);
      }
      go();
    }

    function go() {
      console.debug("BBH ♥ Hello");
      loadScripts().then(function(_) {
        mapGlobals();
        checkLeaks();
      });
    }

    //--------------------------------------------------------------------------

    self.globalStart = Object.keys(window);
    self.globalIgnores = [];
    self.globalLeaks = [];
    self.requiredScriptUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.7.7/babel.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js',
    ];
    self.defaultMapping = [
      { name: 'bbh',       ignores: 'bbh' },
      { name: 'babel',     exports: 'Babel'},
      { name: 'requirejs', ignores: ['__core-js_shared__', 'requirejs', 'require', 'define'] },
    ];
    self.babelConfig = {
      presets: ['es2015'],
      plugins: [],
    };

    //--------------------------------------------------------------------------

    function loadScripts(){
      return Promise.all(self.requiredScriptUrls.map(function(url) {
        return new Promise(function(resolve){
          var script = document.createElement('script');
          script.setAttribute('data-name', url.substr((url.lastIndexOf('/') || -1) + 1));
          script.async = false;
          script.src = url;
          script.onload = function() { resolve(script) }
          document.body.appendChild(script);
        })
      }));
    }

    function mapGlobals() {
      self.defaultMapping.forEach(function(_) {
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
        [].push.apply(self.globalIgnores, _.ignores);
      });
    }

    function checkLeaks() {
      self.globalLeaks = Object.keys(window).filter(function(k) { return !~self.globalStart.concat(self.globalIgnores).indexOf(k) });
      if (self.globalLeaks.length) {
        console.debug("BBH ♥ Global Leak" + (self.globalLeaks.length > 1 ? "s" : "") + " Detected: " + self.globalLeaks.join(', '))
      }
    }
  }
})();
