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

      <!-- Example -->
      <script type="text/babel">
        import { welcome } from 'bbh'
        document.getElementById('app').textContent = welcome
      </script>

    </div>
  </body>
</html>
