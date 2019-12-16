'use strict';

const path = require('path');
const fs = require('fs');

const scriptPath = path.join(__dirname, 'assets', 'html-report.js');

module.exports = () => fs.readFileSync(scriptPath, 'utf-8');
