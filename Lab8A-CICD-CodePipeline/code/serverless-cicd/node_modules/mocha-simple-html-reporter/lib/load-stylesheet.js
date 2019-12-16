'use strict';

const fs = require('fs');

const findStylesheet = require('./find-stylesheet');

module.exports = () => {
    const paths = findStylesheet();

    return paths.map(stylesheetPath => fs.readFileSync(stylesheetPath, 'utf-8')).join('');
};
