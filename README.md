BBH ♥ Hello
===========

The Babel Browser Harness (BBH) is a simple CDN-based browser harness that
provides in-browser ES6+ transpiling via [Babel](https://babeljs.io/) with
a single script include.

In other words, it's a quick and easy way to spin up a single-file ES6+ sandbox
without worrying about Webpack, Browserify, Gulp, Grunt, etc.

***Example***
```html
<!-- index.html -->
<html>
  <head>
    <!-- Include BBH  -->
    <script src="bbh.js"></script>
  </head>
  <body>

    <!-- Use "text/babel" script type -->
    <script type="text/babel" name="example">
      import { message } from 'my-module'
      console.log(message)
    </script>

    <script type="text/babel" name="my-module">
      export const message = "Hello, World!"
    </script>

  </body>
</html>
```

*That's it!*

BBH will quietly include anything it needs via CDN in the background.

You don't even need a web server!

Installation
------------

Include `bbh.js` anywhere in your HTML file and reload the page.

After a couple of seconds, happiness should appear in your browser's console:
```
BBH ♥ Hello
```

If it does, use `<script type="text/babel">` for all scripts you want to be
handled by BBH.

If it does not, you are probably running an unsupported and unhappy browser.

*(BBH is primarily developed and tested using up-to-date Google Chrome)*

Libraries + Options
-------------------

BBH using a module mapping system to handle external libraries, like React,
Angular, or jQuery.

It can modularize any libraries you've already included in your page, or it can
import and modularize them for you.

There are other options available as well, for example setting where transpiled
scripts will be placed in the DOM (`appendTarget`).

For details on modularizing your libraries and other available options,
see the [Configuration](#configuration) section.

Configuration
-------------
Configuration is handled via attribute assignment or modification of the `bbh`
global variable.

***Example***
```html
<script src="bbh.js"></script>
...
<script>
  bbh.babelConfig = {
    presets: ['es2015', 'react'],
    plugins: ['transform-object-rest-spread'],
    minify: true
  }
  bbh.modules = {
    jquery: {
      exports: ['jQuery', '$'],
      src: 'http://code.jquery.com/jquery-3.0.0.min.js'
    }
  }
  bbh.removeModuleScripts = false
</script>
```

### Configuration Options
The following configuration options are available:

#### `appendTarget`
If set, this option defines a target element in which to place all generated
script elements.

If no `appendTarget` is set, BBH will first look for an element with an
`id="bbh"` attribute. If one is not found it will default to the
`document.body`.

* *(alternate default target `id` values: `BBH`, `__bbh`, `__BBH`)*

***Example***
```js
bbh.appendTarget = document.getElementById('myDiv')
```

#### `babelConfig`
This property is used to set/update the Babel configuration options. It should
accept most valid [Babel Options](http://babeljs.io/docs/usage/options/), though
most are not usable in a browser context.

The most commonly used options are `presets` and `plugins`:

* `presets` defaults to `['es2015']`
* `plugins` defaults to an empty array (no plugins)

***Example***
```js
bbh.babelConfig = {
  presets: ['es2015', 'react'],
  plugins: ['transform-object-rest-spread'],
  minify: true
}
```

#### `modules`
This property is primarily used to map external libraries to
importable modules. It can be either an `Object` or an `Array`. The array
syntax (uses a `name` property) should be used when library loading order is
important.

If the `src` property is defined, the external library will be loaded in the
background (via a generated `script` tag). This allows for all dependency
configuration to be managed in one place.

If, you prefer to load the script yourself, or wish to create an importable
module inline from existing ES5 code, just leave off the `src` property.
The `window` globals will be searched for your library module.

* **Note:** If you are importing scripts manually, `bbh.js` should be imported
  first, so it can track new global variables and watch for "leaks".

  See the [Logging](#logging) section for more details on global variable
  leaks.

**Available Properties**

The following properties may be set in a `modules` entry:
* `name` - String - (array syntax only) - The name of the module to be used
  for import statements. When using the alternate object syntax, the key is
  used as the name.

* `exports`- String or Array - The name(s) of the global variable(s) placed
  on the `window` object by the mapped library. If an array is used, the first
  variable found from the list is the one that is mapped.

  By default these variables will be **removed** from the `window` object, but
  this may be disabled using `callNoConflict` and `deleteFromWindow`.

* `ignores` - String or Array - This property is similar to `exports`, in that
  is the name(s) of the global variable(s) placed on the `window` object by
  the mapped library. Except, instead of mapping or deleting these variables,
  they are simply ignored when checking for global variable "leaks".

  This is useful if you know you want certain variable to remain global but
  don't want them cluttering your console logs.

  See the [Logging](#logging) section for more details on global variable
  leaks.

* `callNoConflict` - Boolean - (Default = `true`) - By default, if a library
  variable specified in `exports` has a child `noConflict()` method, this
  method will be called after the library has been mapped. Set this to `false`
  to disable the feature.

* `deleteFromWindow` - Boolean - (Default = `true`) - By default, library
  variables specified in `exports` will be removed from the `window` object
  after the library has been mapped. Set this to `false` to disable the
  feature.

  The is rarely desirable, as the `ignores` option handles this better, but
  it can be useful to specify that a library should be mapped (for transpiled
  script imports) and still remain available to local (non-transpiled)
  scripts.

***Example (Object)***
```js
bbh.modules = {
  jquery: {
    exports: ['jQuery', '$'],
    src: 'http://code.jquery.com/jquery-3.0.0.min.js'
  }
}
```

***Example (Array)***
```js
bbh.modules = [
  {
    name: "react",
    exports: 'React',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.1.0/react.min.js'
  },
  {
    name: "react-dom",
    exports: 'ReactDOM',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.1.0/react-dom.min.js'
  },
]
```

***Example (Manual Imports)***
```html
<script src="bbh.js"></script>
<script src="http://code.jquery.com/jquery-3.0.0.min.js"></script>

<script> window.MyLib = { message: 'Hello, World!' } </script>

<script>
  bbh.modules = {
    jquery: { exports: ['jQuery', '$'] },
    mylib:  { exports: 'MyLib' }
  }
</script>

<!-- Use jQuery to populate a div with the message from MyLib -->

<div id="app"></app>

<script type="text/babel">
  import $ from 'jquery'
  import { message } from 'mylib'
  $('#app').text(message)
</script>
```

* `removeModuleScripts` - This property is used to keep the `script` tags
  (generated by defining the `modules.src` property) from being removed
  from the DOM.

  By default, module `script` tags are removed after they have been applied to
  keep the DOM clean for easy debugging.

  Set this property to `false` to leave generated script tags in place.

Logging
-------

FAQ
---
* **Q:** *Can I separate my modules into their own files?*

  **A:** ***Yes***, but it requires using a simple web server.

  * If you have [Node.js](https://nodejs.org/) installed, you can use
    the [http-server](https://www.npmjs.com/package/http-server) package to fire
    up a simple web server.

  * Alternately, if you are on a a *Mac* or *Linux* machine, you probably
    already have Python installed, which comes with it's own simple web server.

    Open a terminal and run the following command to start a simple Python HTTP
    server in the current directory:
    ```sh
    $ python -m SimpleHTTPServer
    ```
* **Q:** *Does BBH handle React/JSX syntax?*

  **A:** ***Yes!*** Because BBH is based on Babel, it *does* support React/JSX
    syntax, but it has to be enabled in the Babel configuration.

    Here's a sample configuration that handles the Babel presets and module
    mapping for React and ReactDOM 15.1.0:
    ```js
    bbh.babelConfig = {
      presets: ['es2015', 'react']
    };
    bbh.modules = [
      {
        name: "react",
        exports: 'React',
        src: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.1.0/react.min.js'
      },
      {
        name: "react-dom",
        exports: 'ReactDOM',
        src: 'https://cdnjs.cloudflare.com/ajax/libs/react/15.1.0/react-dom.min.js'
      },
    ]
    ```

    See the [Configuration](#configuration) section for more details on module
    definitions and Babel presets).

Credit
------
* BBH's transpiling capability is based around
  [babel-standalone](https://github.com/Daniel15/babel-standalone)
  by Daniel Lo Nigro
* Module registration is handled by the [RequireJS](http://requirejs.org/) AMD
  module loader

License
-------
MIT
