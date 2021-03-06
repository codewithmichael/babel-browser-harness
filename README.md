BBH ♥ Hello
===========

[Installation](#installation)
| [External Libraries](#external-libraries)
| [Configuration](#configuration)
| [Separate Scripts](#separate-scripts)
| [Logging](#logging)
| [FAQ](#faq)
| [Credit](#credit)
| [License](#license)

The Babel Browser Harness (BBH) is a simple CDN-based browser polyfill
that provides in-browser ES6+ transpiling via [Babel](https://babeljs.io/) using
only a single script include.

In other words, it's a quick and easy way to spin up an ES6+ sandbox without
worrying about Webpack, Browserify, Gulp, Grunt, etc.

**You don't even need a web server!**

This makes it ideal for on-the-go prototyping, where you often can't transpile
(iOS, Android), and lets you jump right into working with new technologies
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

---

Installation
------------

Check out or install Babel Browser Harness from one of the following locations:

* ***[GitHub](https://github.com/codewithmichael/babel-browser-harness):***
  ```
  git clone https://github.com/codewithmichael/babel-browser-harness.git
  ```
* ***[NPM](https://www.npmjs.com/package/babel-browser-harness):***
  ```
  npm install babel-browser-harness
  ```
* ***Bower:***
  ```
  bower install babel-browser-harness
  ```

Include `bbh.js` or `bbh.min.js` anywhere in your HTML file like so...
```html
<script src="bbh.js"></script>
```
...and open or reload the HTML file in your browser.

After a couple of seconds, happiness should appear in your ***browser
console***.

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

**Note:** If you are developing on your mobile device and don't have access to
your browser's developer console, you can
[enable a Firebug Lite console](#firebug-lite-developer-console).

---

External Libraries
------------------

BBH uses a module mapping system to handle external libraries such as React,
Angular, Underscore, or jQuery.

It can modularize any libraries you've already included in your page, or it can
import and modularize them for you.

For details on modularizing your libraries and other available options,
see the [Configuration](#configuration) section.

---

### Firebug Lite (Developer Console)

*Babel Browser Harness is in no way affiliated with or publicly endorsed by
Mozilla, Parakey, or the Firebug/Firebug Lite projects or their maintainers.*

[Firebug Lite](http://getfirebug.com/firebuglite) is a pared-down, in-browser
port of Mozilla's Firebug web development tool. It includes a developer console
and DOM inspector which can make working from a mobile device significantly
easier.

If you are developing from a mobile device and don't have access to your
browser's developer console, you can enable a Firebug Lite console right from
your script import with the [hash option](#hash-options):
```html
<script src="bbh.js#firebug"></script>
```
...or with the following command (after loading `bbh.js`)...
```html
<script>
  bbh.enableFirebug();
</script>
```

Alternately, if you have a local copy of Firebug Lite or prefer a specific
version of the library, you can pass an alternate file URL to the
`enableFirebug()` method. *You MUST provide any necessary hash options
(such as `#startOpened`) as part of your custom url.*

**Note:** While it is recommended to use the built-in hash option or
`enableFirebug()` method, you can alternately load Firebug Lite manually via a
custom `script` tag. If you choose to do so, it is recommended to import
Firebug Lite ***before*** `bbh.js` so it can catch all of BBH's startup
messages.

---

Configuration
-------------
Configuration is handled through property modification in the URL hash or using
the `bbh` global variable. All [hash options](#hash-options) have configuration
script equivalents.

***Example (URL Hash - Enable React + Firebug Lite and Minify Scripts)***
```html
<script src="bbh.js#react|firebug|minify"></script>
```

***Example (Config Script - Prepare Babel Config and Load a Library Module)***
```html
<script src="bbh.js"></script>
...
<script>
  bbh.babelConfig = {
    presets: ['es2015', 'react'],
    plugins: ['transform-object-rest-spread'],
    minified: true
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

---

### Hash Options

Hash options act as shortcuts to commonly used developer functions and
[configuration options](#configuration-options). This keeps configuration time
to a minimum, reduces typed character count for mobile developers, and can
retain all of your BBH information in a single `script` tag at the location of
import (for common configurations).

Hash options are set by adding a hash (`#`) string to the end of the URL in the
`src` attribute of the `script` tag you use to load BBH:
```html
<script src="bbh.js#react|minify"></script>
```
The above example enables [React](https://facebook.github.io/react/) parsing
in Babel (in addition to the standard ES2015), and minifies transpiled scripts.

Hash options are separated via the pipe (`|`) character and may contain an
equals sign (`=`). They can also have comma-separated values assigned to them
when appropriate.

When no equals sign is used, the assumed value is `true`.

Valid hash options are: `firebug`, `minify` (or `minified`), `react`,
`registration`, `plugins`, `presets`.

Options are processed sequentially and may cancel or override each other.

*See detailed information on each hash option below.*

**Note:** Hash options are based on
[`document.currentScript`](https://developer.mozilla.org/en-US/docs/Web/API/Document/currentScript)
and are, therefore, browser-dependent. Most modern browsers support the feature,
but if your development environment does not, you should use the standard
[configuration options](#configuration-options).

#### `firebug`
* Boolean

```html
<script src="bbh.js#firebug"></script>
<script src="bbh.js#firebug=true"></script>
<script src="bbh.js#firebug=false"></script>
```

Enables the [Firebug Lite](#firebug-lite-developer-console) console and
developer tool.

Equivalent to calling `bbh.enableFirebug()`.

#### `minify`
* Boolean
* *Alternate option name: `minified`*

```html
<script src="bbh.js#minify"></script>
<script src="bbh.js#minify=true"></script>
<script src="bbh.js#minify=false"></script>
```

Enables the `minified` flag in the [`Babel configuration`](#babelconfig)
options.

Equivalent to calling `bbh.babelConfig.minified = true`.

#### `react`
* Boolean

```html
<script src="bbh.js#react"></script>
<script src="bbh.js#react=true"></script>
<script src="bbh.js#react=false"></script>
```

Adds or removes the `"react"` option in the `presets` property of the
[Babel configuration](#babelconfig).

Equivalent to `bbh.babelConfig.presets.push('react')`.

#### `registration`
* Boolean

```html
<script src="bbh.js#registration"></script>
<script src="bbh.js#registration=true"></script>
<script src="bbh.js#registration=false"></script>
```

Enables or disables *registration mode* for the current file.

See the [registration system](#registration-system) documentation for more
information.

Equivalent to calling [`bbh.registrationMode()`](#registrationmode).

#### `plugins`
* Comma-separated String

```html
<script src="bbh.js#plugins=plugin1,plugin2"></script>
```

Directly set the `plugins` used in the [Babel configuration](#babelconfig).

Equivalent to calling `bbh.babelConfig.plugins = ['plugin1', 'plugin2', ...]`.

#### `presets`
* Comma-separated String

```html
<script src="bbh.js#presets=preset1,preset2"></script>
```

Directly set the `presets` used in the [Babel configuration](#babelconfig).

Equivalent to calling `bbh.babelConfig.presets = ['preset1', 'preset2', ...]`.

---

### Configuration Options
Configuration options work in all supported modern browsers. They are applied to
the global `bbh` variable in a `script` tag after `bbh.js` has been included in
your page.

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

#### `autoloadReact`
* Boolean
* Default: `true`

***Example***
```js
bbh.autoloadReact = false
```

By default, if the `"react"` preset is enabled in [`babelConfig`](#babelconfig),
the react-related libraries (`react` and `react-dom`) will automatically be
loaded for you, unless you have already specified at least one of them manually
in [`modules`](#modules).

You can disable this feature by setting `autoloadReact` to false.

#### `babelConfig`

***Example***
```js
bbh.babelConfig = {
  presets: ['es2015', 'react'],
  plugins: ['transform-object-rest-spread'],
  minified: true
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
    name: "underscore",
    exports: "_",
    src: "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"
  },
  {
    name: "backbone",
    exports: "Backbone",
    src: "https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3/backbone-min.js"
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

#### `removeModuleScripts`

* Boolean
* Default: `true`

***Example***
```js
bbh.removeModuleScripts = false
```

The `removeModuleScripts` property is used to keep the `script` tags generated
by defining the `modules.src` property from being removed from the DOM.

By default, external module `script` tags are removed after they have been
applied to keep the DOM clean for easy debugging.

Set the `removeModuleScripts` property to `false` to retain these generated
`script` tags.

#### `removeRegisterScripts`

* Boolean
* Default: `true`

***Example***
```js
bbh.removeRegisterScripts = false
```

The `removeRegisterScripts` property is used to keep the `script` tags generated
by using the [register()](#register) method from being removed from the DOM.

By default, `script` tags generated by importing from registered files are
removed from the DOM after they have been transpiled to keep the DOM clean for
easy debugging.

Set the `removeRegisterScripts` property to `false` to retain these imported
`script` tags.

---

Separate Scripts
----------------

Projects can grow quickly, and it is often desirable to break your scripts out
into separate files. BBH provides two systems for accomplishing this
task—[direct script imports](#direct-script-imports) and an internal
[registration system](#registration-system).

---

### Direct Script Imports

```html
<script type="text/babel" name="myscript" src="./myscript.js"></script>
```

A "direct script import" works like any other `<script src="...">` import on
your page, except that you append the `type="text/babel"` attribute.

As with inline Babel scripts, you can define a `name` attribute to specify the
module name used for import. If you prefer to use the `src` path as the module
name, you may omit the `name` attribute all together.

Because `script` elements of type `text/babel` do not designate a known
browser-compatible script type, they are ignored by the browser and subsequently
post-processed by BBH.

File retrieval is performed via AJAX request.

* **PROS:**
  * Allows for importing existing ES6+ script files
  * Is fairly seamless
  * Works great in standard development server environment

* **CONS:**
  * Requires a web server (to support AJAX requests)
  * Requires CORS server configuration to work cross-origin
  * Can't usually be used for on-the-go development from a mobile device

#### Local Web Server

If you choose to run a local web server, here are a couple of simple options:

* If you are on a *Mac* or *Linux* machine, you probably already have Python
  installed, which comes with it's own simple web server.

  Open a terminal and run the following command to start a simple Python HTTP
  server in the current directory:
  ```sh
  $ python -m SimpleHTTPServer
  ```

* Alternately, if you have [Node.js](https://nodejs.org/) installed, you can use
  the [http-server](https://www.npmjs.com/package/http-server) package to fire
  up a simple web server.

---

### Registration System

***No web server required!***

The registration system is fully functional even when you're developing on your
local machine without a web server—i.e. opening local files in your web browser
and using the `file://` URL scheme.

Instead of performing AJAX requests, registered files are loaded via the
`postMessage` API, which does not require AJAX or CORS to function.

This makes the registration system a viable option for developers working from a
mobile device to separate their scripts without the use of an external server.

* **PROS**
  * Does not require a web server for local development
  * Files may be imported from remote servers without CORS support
  * Works in most mobile-device-based development environments

* **CONS**
  * Requires additional script file configuration in HTML format
  * Can't be used to load pre-existing ES6+ script files (without modification)

### Registering a Module File

* External module files are configured to run in "registration mode" via
  [`registrationMode()`](#registrationmode)
* The main file designates external file dependencies via
  [`register()`](#register)
* In some cases, you may also need
  [`allowCrossOriginRegistration()`](#allowcrossoriginregistration)

When BBH runs in registration mode, it doesn't transpile scripts found on the
page. Instead it waits for a `register()` request and responds by returning a
serialized version of all the `<script type="text/babel">` elements on the page.
Those elements are then deserialized for transpiling in the calling document.

***Example (Loading a Module from an External File)***

**my-module.html**
```html
<!-- MODULE SCRIPT -->
<script type="text/babel" name="my-module">
  export const message = "This message comes from my module!"
</script>

<!-- CONFIG -->
<script src="bbh.js#registration"></script>
```

**index.html**
```html
<!DOCTYPE html>
<html>
  <head>
    <title>External Module Example</title>
  </head>
  <body>

    <!-- MAIN SCRIPT -->
    <script type="text/babel">
      import { message } from 'my-module'
      document.body.textContent = message
    </script>

    <!-- CONFIG -->
    <script src="bbh.js"></script>
    <script> bbh.register({ src: './my-module.html' }) </script>

  </body>
</html>
```

In the above example, the main script in `index.html` wants
to load message content from `my-module`, which is declared in
`my-module.html`. To accomplish this, `register()` is used to
load `my-module.html`, which has been configured to run BBH in *registration
mode*.

**Note:** `my-module.html` used a [hash option](#hash-options), `#registration`,
appended to the `script` tag's `src` URL to enable registration mode.
Alternately, you can initiate registration mode by calling
`bbh.registrationMode()` directly. See the
[`registrationMode()`](#registrationmode) method documentation for further
details.

#### Cross-Origin Issues

If you are loading modules from a remote server or are using a local server with
inconsistent origin declarations (such as *many* mobile device implementations),
you may receive the error `Cross-origin registration rejected`.

If this occurs, you can use the `bbh.allowCrossOriginRegistration()` method to
bypass the problem. However, the option should generally only be used for local
development or on a shared development server, as it effectively makes any
scripts configured for "registration mode" publicly available.

**Note:** `bbh.allowCrossOriginRegistration()` must be called in ***both*** the
calling and receiving files (after `bbh.js` has been imported) to enable
cross-origin registration, as origin security checks are performed on both ends.

### Registration Methods

#### `register()`

***Example***
```html
<script src="bbh.js"></script>
<script>

  // Single File Registration
  bbh.register({ src: './file.html', timeout: 5000 })

  // Multiple File Registration
  bbh.register([
    { src: './file1.html' },
    { src: './file2.html' }
  ])

</script>
```

The `register()` method is used to request the contents of an external file.

`register()` accepts an `options` argument in Object format (or an Array of
Objects) with the following available properties:
* **src** - *REQUIRED* - String - The URL or relative path to the requested file
* **timeout** - *OPTIONAL* - Number - (Default: `3000`) - The number of
  milliseconds to wait for a response from the registered file before giving up
* **messageId** - *OPTIONAL* - String - *For debugging purposes only*. The
  `messageId` is usually a randomly assigned value, but you may set it manually
  to track `message` events if you need to debug the `postMessage` API

#### `registrationMode()`

***Example (Hash Option)***
```html
<script src="bbh.js#registration"></script>
```

***Example (Config Option)***
```html
<script src="bbh.js"></script>
<script>

  // Enable
  bbh.registrationMode()

  // Disable
  bbh.registrationMode(false)

</script>
```

The `registrationMode()` method is used to set a file to listen for a
`register()` request from a calling file. It must be called within a file for
that file to be loadable via the registration system.

Alternately, the shorthand [hash option](#hash-options) may be used to enable
registration mode. This simply entails adding `#registration` to the end of the
BBH `script` tag's `src` URL.

#### `allowCrossOriginRegistration()`

***Example (Enable/Disable)***
```html
<script src="bbh.js"></script>
<script>

  // Enable
  bbh.allowCrossOriginRegistration()

  // Disable
  bbh.allowCrossOriginRegistration(false)

</script>
```

The `allowCrossOriginRegistration()` method is used to disable origin-based
security checks on `postMessage` API events used by the registration system.

This is useful if you want to load a module file from a remote development
server or if you are on a mobile device with poorly managed origin declarations.

**Note:** `bbh.allowCrossOriginRegistration()` must be called in ***both*** the
calling and receiving files (after `bbh.js` has been imported) to enable
cross-origin registration, as origin security checks are performed on both ends.

**Note:** Cross-origin registration should generally only be used for local
development or on a shared development server, as it effectively makes any
scripts configured for "registration mode" publicly available.

---

Logging
-------

BBH logs it's progress as it processes your scripts. These logs are available
in your browser console.

**Note:** If you are developing on your mobile device and don't have access to
your browser's developer console, you can
[enable a Firebug Lite console](#firebug-lite-developer-console).

### `BBH ♥ Hello`
BBH begins processing with a welcome message. This message is displayed as soon
as configuration options have been successfully determined.

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

Also, if you're using the registration system and a given module doesn't respond
within the designated timeout period, you may receive a message like the
following:
```
BBH ♥ Error Detected :(
BBH ♥ Registration didn't resolve: "./module.html" (3000ms)
```
In this case, it is most likely that you forgot to set the module file to run in
registration mode. See the [registrationMode()](#registrationmode) documentation
for more details.

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
...followed by a console entry detailing the syntax error and location.

### `BBH ♥ Running`
If you receive this message, BBH has completed transpiling, handed the resultant
scripts off to your browser, and is running away.

If any errors occur at this point, they are entirely your fault :D

---

FAQ
---

* [Why isn't my BBH using the heart (♥) symbol?](#why-isnt-my-bbh-using-the-heart--symbol)
* [Does BBH handle React/JSX syntax?](#does-bbh-handle-reactjsx-syntax)
* [Can I mix and match normal (ES5) and ES6+ scripts?](#can-i-mix-and-match-normal-es5-and-es6-scripts)
* [Can I separate my modules into their own files?](#can-i-separate-my-modules-into-their-own-files)
* [How can I develop with BBH from my mobile device?](#how-can-i-develop-with-bbh-from-my-mobile-device)
* [Does BBH support valid markup attributes?](#does-bbh-support-valid-markup-attributes)
* [Is BBH "production-ready"?](#is-bbh-production-ready)

### *Why isn't my BBH using the heart (♥) symbol?*

The heart symbol (♥) is a unicode character in the UTF-8 character set.

At startup BBH checks to see if it is running in a UTF-8 context. If not, it
uses a middle dot (·), a character capable of being rendered in the browser's
default ISO-8859-1 character set.

If you would like to have UTF-8 character support (and see the heart), you may
change the character set for either the entire document or just the BBH script
itself (see below).

***Document-Level UTF-8 Support***
```html
<html>
  <head>
    <meta charset="utf-8" />
    ...
```

***Script-Level UTF-8 Support***
```html
<script src="bbh.js" charset="utf-8"></script>
```

### *Does BBH handle React/JSX syntax?*

***Yes!*** Because BBH is based on Babel, it *does* support
[React](https://facebook.github.io/react/)/JSX syntax, but it has to be enabled
via a [hash](#hash-options) or [configuration](#configuration-options) option:

***Example - Enable React Using a Hash Option***
```html
<script src="bbh.js#react"></script>
```

***Example - Enable React Using a Configuration Option***
```js
bbh.babelConfig = { presets: ["es2015", "react"] };
```

BBH will automatically import React libraries for you once the `"react"` preset
is defined, but if you prefer a specific version, you can load it using the
[`modules`](#modules) configuration option.

See the [Configuration](#configuration) section for more details on module
definitions and Babel presets.

See [`autoloadReact`](#autoloadreact) for more information on the automatic
loading feature for React libraries.

### *Can I mix and match normal (ES5) and ES6+ scripts?*

***Yes,*** but Babel-transpiled scripts run *after* all other
scripts on the page, so you'll still want to add `type="text/babel"` to your
regular ES5 scripts so they run in sequence.

Don't worry, normal ES5 scripts works just fine when parsed as ES6+,
but they'll have the restriction of running as their own module, so you'll
have to assign any global variables directly to the `window` object.

Also, you can use CommonJS module syntax (`require`, `module`, `exports`) if
you would like to interact with the module system.

### *Can I separate my modules into their own files?*

***Yes***, using either direct script imports or the built-in registration
system. See the [Separate Scripts](#separate-scripts) section for more details.

### *How can I develop with BBH from my mobile device?*

If you're using a mobile editor that has a built-in, WebKit-based preview
option (like [Working Copy](http://workingcopyapp.com/),
[Textastic](http://www.textasticapp.com/), or
[Coda](https://panic.com/coda-ios/)) then you're ready to go. Just check out or
copy this project into your mobile editor and open `example.html` in your
editor's preview mode to test.

**Note:** Developer console capabilities can vary widely between editors. To
provide a consistent JavaScript-based console for debugging on your mobile
device, enable the
[Firebug Lite developer console](#firebug-lite-developer-console) with a
[hash](#hash-options) or [configuration](#configuration-options) option:

***Example - Enable Firebug Lite with a Hash Option***
```html
<script src="bbh.js#firebug"></script>
```

***Example - Enable Firebug Lite with a Config Option***
```html
<script>
  bbh.enableFirebug();
</script>
```

### *Does BBH support valid markup attributes?*

***It does!*** The examples provided in the documentation often don't use
strictly valid HTML5 attributes. If you require (or just prefer) valid HTML5
attributes, you can replace BBH-specific tag attributes with their `data-*`
equivalent.

***Example (Setting the "data-name" attribute)***
```html
<!-- Use "data-name" instead of "name" -->
<script type="text/babel" data-name="my-module-name">
  export const message = "I'm a module!"
</script>
```

### *Is BBH "production-ready"?*

***No!*** BBH is strictly a development tool and should never be used
in a production environment. When you feel your code has matured to a serious
level, create an appropriate build environment or transpile server-side.

If you need in-browser transpiling, for example to create a user-facing REPL
like [JSFiddle](https://jsfiddle.net/), consider a dependency-free, packaged
library solution like
[babel-standalone](https://github.com/Daniel15/babel-standalone)
that focuses solely on transpiling.

---

Credit
------
*Babel Browser Harness is not affiliated with or publicly endorsed by the
following projects or their maintainers. Project/Company/Author names are
provided solely for the purpose of attribution.*

* BBH's transpiling capability is based around
  [babel-standalone](https://github.com/Daniel15/babel-standalone)
  by Daniel Lo Nigro
* Module registration is handled by the [RequireJS](http://requirejs.org/) AMD
  module loader
* The optional developer console is part of the Mozilla/Parakey
  [Firebug Lite](http://getfirebug.com/firebuglite) project
  ([source on GitHub](https://github.com/firebug/firebug-lite))

---

License
-------
MIT
