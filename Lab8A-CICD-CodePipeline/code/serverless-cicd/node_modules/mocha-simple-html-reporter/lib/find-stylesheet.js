'use strict';

const path = require('path');

module.exports = () => {
    const mochaMainFilename = require.resolve('mocha');
    const mochaDirname = path.dirname(mochaMainFilename);
    const nativeStylesheet = path.join(mochaDirname, 'mocha.css');
    const htmlReportStylesheet = path.join(__dirname, 'assets', 'html-report.css');

    return [nativeStylesheet, htmlReportStylesheet];
};
