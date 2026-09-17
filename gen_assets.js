const fs = require('fs');
const src = fs.readFileSync('c:/Users/himanshu.kumar5/Downloads/XYZ_PICKING_IPP_COUNTER_MOBILE.txt', 'utf8');
const start = src.indexOf('(function () {');
const end = src.lastIndexOf('})();') + 5;
let code = src.slice(start, end).replace(/\r\n/g, '\n');

code = code.replace(
  /  if \(!isAllowedURL\(\)\) return;\n  if \(window\.__pickingCounterActive\) return;\n  window\.__pickingCounterActive = true;/,
  [
    "  function teardownCounter() {",
    "    var el = document.getElementById('picking-counter-widget');",
    "    if (el) el.remove();",
    "    window.__pickingCounterActive = false;",
    "  }",
    "  if (!isAllowedURL()) { teardownCounter(); return; }",
    "  if (window.__pickingCounterActive && document.getElementById('picking-counter-widget')) return;",
    "  window.__pickingCounterActive = true;"
  ].join('\n')
);

code = code.replace(
  /    \} else \{\n      counterDiv\.style\.display = 'none';\n    \}/,
  "    } else {\n      teardownCounter();\n    }"
);

fs.writeFileSync(
  'c:/Users/himanshu.kumar5/Downloads/babylon_picking_app/app/src/main/assets/picking_counter.js',
  code
);
console.log('Written picking_counter.js', code.length, 'chars');
