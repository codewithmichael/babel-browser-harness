BBH ♥ Hello
===========

The Babel Browser Harness (BBH) is a simple CDN-based browser polyfill
that provides in-browser ES6+ transpiling via [Babel](https://babeljs.io/) using
only a single script include.

In other words, it's a quick and easy way to spin up an ES6+ sandbox without
worrying about Webpack, Browserify, Gulp, Grunt, etc.

You don't even need a web server!

This makes it ideal for on-the-go prototyping, where you often can't transpile
(Android, iOS), and lets you jump right into working with new technologies
without investing precious time on system configuration.

***Example***
```html
<html>
  <head>

    <!-- Include BBH  -->
    <script src="bbh.js"></script>

  </head>
  <body>
    <div id="app">

      <!-- Use "text/babel" script type -->
      <script type="text/babel">

        // Write ES6+

        // Display "BBH ♥ Hello"
        import { welcome } from 'bbh'
        document.getElementById('app').textContent = welcome

      </script>
    </div>
  </body>
</html>
```

*That's it!*

BBH will quietly include everything it needs in the background via CDN.

Installation
------------

Include `bbh.js` anywhere in your HTML file and open or reload the page.

After a couple of seconds, happiness should appear
***in your browser console***.

***Figure A.*** *"What happiness looks like"*
```
BBH ♥ Hello
```

* ***If you see happiness:***

  *Congratulations!*

  You may now use `<script type="text/babel">` for all your ES6+ scripts.

* ***If you do not see happiness:***

  You are probably running an unsupported and unhappy browser :(

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

***Example***
```js
bbh.appendTarget = document.getElementById('myDiv')
```

If `appendTarget` is set, the option defines a target element in which to place
all generated script elements.

If `appendTarget` is not set, BBH will first look for an element with an
`id="bbh"` attribute. If one is not found it will default to the
`document.body`.

* *(alternate default target `id` values: `BBH`, `__bbh`, `__BBH`)*

#### `babelConfig`

***Example***
```js
bbh.babelConfig = {
  presets: ['es2015', 'react'],
  plugins: ['transform-object-rest-spread'],
  minify: true
}
```

The `babelConfig` property is used to set/update the Babel configuration
options. It should accept most valid
[Babel Options](http://babeljs.io/docs/usage/options/), though most are not
usable in a browser context.

The most commonly used options are `presets` and `plugins`:

* `presets` defaults to `['es2015']`
* `plugins` defaults to an empty array (no plugins)

#### `modules`

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

The `modules` property is primarily used to map external libraries to
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

**Available `modules` Properties**

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

* `callNoConflict` - Boolean - (Default: `true`) - By default, if a library
  variable specified in `exports` has a child `noConflict()` method, this
  method will be called after the library has been mapped. Set this to `false`
  to disable the feature.

* `deleteFromWindow` - Boolean - (Default: `true`) - By default, library
  variables specified in `exports` will be removed from the `window` object
  after the library has been mapped. Set this to `false` to disable the
  feature.

  The is rarely desirable, as the `ignores` option handles this better, but
  it can be useful to specify that a library should be mapped (for transpiled
  script imports) and still remain available to local (non-transpiled)
  scripts.

* `removeModuleScripts` - Boolean - (Default: `true`) - This property is used to
  keep the `script` tags (generated by defining the `modules.src` property) from
  being removed from the DOM.

  By default, module `script` tags are removed after they have been applied to
  keep the DOM clean for easy debugging.

  Set this property to `false` to leave generated script tags in place.

Logging
-------

BBH logs it's progress as it processes your scripts. These logs are available
in your browser console.

### `BBH ♥ Hello`
BBH always begins processing with a welcome message. This message is displayed
as soon as configuration options have been successfully determined.

### `BBH ♥ Loading Modules`
This message designates that requested scripts from the `modules` configuration
are being downloaded (or loaded from cache), globals are being mapped, and BBH
is checking for global leaks.

The duration of this stage is dependent on the speed of your network/internet
connection in retrieving external dependencies.

If any requested external libraries cannot be loaded—for example due to a
missing file, incorrect url, or unavailable host/CDN—you will receive a
console message similar to the following:
```
BBH ♥ Error Detected :(
BBH ♥ The script "jquery.min.js" is not accessible
```

### `BBH ♥ Global Leaks Detected`
During the `Loading Modules` phase, you may receive a message similar to the
following:
```
BBH ♥ Global Leaks Detected: ["jQuery","$"]
```

This isn't an error. It's just there to let you know that you may have forgotten
to map an imported library to a module.

The provided list is a summary of all global variables registered to the
`window` object since BBH was loaded that have not been mapped.

If this message contains variables that are known globals, and you wish
to keep them global but want to eliminate the log notice, you can map them
using the `ignore` feature of the `modules` configuration property.

*(See the [Configuration](#configuration) section for details on mapping or
ignoring globals and imported libraries via the `modules` property)*

### `BBH ♥ Transpiling`
This message designates that all necessary external libraries and modules have
been assembled and the process of transforming your custom scripts has
begun.

Transpile speed is dependent on your particular machine, but is typically a very
fast process.

If any syntax errors are encountered during this phase, you will receive the
familiar message...
```
BBH ♥ Error Detected :(
```
...followed by a log entry detailing the syntax error and location.

### `BBH ♥ Running`
If you receive this message, BBH has completed transpiling, handed the resultant
scripts off to your browser, and is running away.

If any errors occur at this point, they are entirely your fault :D

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

* **Q:** *Can I mix and match normal (ES5) and ES6+ scripts?*

  **A:** ***Yes,*** but Babel-transpiled scripts run *after* all other
  scripts on the page, so you'll still want to add `type="text/babel"` to your
  regular ES5 scripts so they run in sequence.

  Don't worry, normal ES5 scripts works just fine when parsed as ES6+,
  but they'll have the restriction of running as their own module, so you'll
  have to assign any global variables directly to the `window` object.

  Also, you can use CommonJS module syntax (`require`, `module`, `exports`) if
  you would like to interact with the module system.

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
