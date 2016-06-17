Babel Browser Harness (BBH)
===========================
The Babel Browser Harness (BBH) is a simple CDN-based HTML/JS jig that provides
in-browser ECMAScript transpiling via Babel.

In other words, it's a quick way to spin up a single-file ES2015+ sandbox
without worrying about Webpack, Browserify, Gulp, Grunt, etc.

You don't even need a web server if you keep your script in the same file—e.g.
```html
<script type="text/babel">
  console.log('Hello, World!')
</script>
```

If you would like to load external scripts (web server required):
```html
<script type="text/babel" src="myfile.js"></script>
```

**Note:** If you have Python installed (most Linux + Mac users), you can fire up
a simple web server from a terminal in the current directory with the command:
```sh
$ python -m SimpleHTTPServer
```

Libraries + Options
-------------------
BBH also includes a few commonly used libraries and transpiler options
which can be enabled by uncommenting them in the HTML/JS source.

React/JSX is enabled by default, but can be disabled.

Credits
-------
BBH is based around [babel-standalone](https://github.com/Daniel15/babel-standalone)
by Daniel Lo Nigro.

License
-------
MIT
