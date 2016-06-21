<!--
BBH ♥ Babel Browser Harness
In-browser CDN-based ECMAScript transpiling via Babel
Copyright (c) 2016, Michael Spencer
MIT License
-->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Babel Browser Harness</title>
    <script src="./bbh.js"></script>
  </head>
  <body>
    <div id="app">

      <!------------------------>
      <!-- ♦ YOUR CODE HERE ♦ -->
      <!------------------------>

      <!-- Example (using React) -->
      <script type="text/babel" name="react-example">
        import React from 'react'
        import { render } from 'react-dom'
        import { welcome } from './bbh'

        render(<div>{ welcome }</div>, document.getElementById('app'))
      </script>

    </div>


    <!--------------------------------->
    <!-- ♥ CONFIGURATION FOR REACT ♥ -->
    <!--------------------------------->

    <script>
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
    </script>

  </body>
</html>
