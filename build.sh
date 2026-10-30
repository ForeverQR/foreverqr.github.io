#!/bin/sh
# Builds index.html from the parts in src/. Edit links and ventures in src/app.config.js, page text in src/head.html.
set -e
cd "$(dirname "$0")"
{ cat src/head.html; echo '<script>'; cat src/lib.js; echo '</script><script>'; cat src/app.config.js src/app.part1.js src/app.render.js src/app.main.js; echo '</script></body></html>'; } > index.html
echo "index.html built"
