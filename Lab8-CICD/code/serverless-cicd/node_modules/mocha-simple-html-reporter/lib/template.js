'use strict';

const ms = require('pretty-ms');

module.exports = (data) => `
<html>
    <head>
        <title>Mocha</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style type="text/css">
        ${data.css}
        </style>
    </head>
    <body>
        <div id="mocha">
            <div class="mocha-header">
                <ul class="mocha-menu">
                    <li><span id="toggle-passes" class="toggle-passes">show failures only</span></li>
                </ul>
                <ul class="mocha-stats">
                    <li class="passes">passes: <em>${data.stats.passes}</em></li>
                    <li class="pending">pending: <em>${data.stats.pending}</em></li>
                    <li class="failures">failures: <em>${data.stats.failures}</em></li>
                    <li class="duration">duration: <em>${ms(data.stats.end - data.stats.start)}</em></li>
                </ul>
            </div>
            <ul id="report">${data.report}</ul>
        </div>
        <script>
        ${data.js}
        </script>
    </body>
</html>
`;
