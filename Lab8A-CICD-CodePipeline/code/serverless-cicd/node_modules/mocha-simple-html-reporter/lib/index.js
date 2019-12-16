'use strict';

const fs = require('fs');

const mocha = require('mocha');
const utils = mocha.utils;

const template = require('./template');
const loadStylesheet = require('./load-stylesheet');
const loadScripts = require('./load-scripts');
const getErrorMessage = require('./get-error-message');
const getStacktrace = require('./get-stacktrace');

module.exports = function (runner, options) {
    mocha.reporters.Base.call(this, runner);

    const reporterOpts = options.reporterOptions || {};
    const stats = this.stats;

    let result = '';

    runner.on('end', () => {
        const output = reporterOpts.output;
        const html = template({
            css: loadStylesheet(),
            js: loadScripts(),
            report: result,
            stats
        });

        if (!output) {
            return console.log(html);
        }

        try {
            fs.writeFileSync(output, html);

            console.log(`The report is written in "${output}" file.`);
        } catch (err) {
            console.error(err);
        }
    });

    runner.on('suite', suite => {
        if (suite.root) { return; }

        const title = utils.escape(suite.title);

        result += '<li class="suite">';
        result += `<h1>${title}</h1>`;
        result += '<ul>';
    });

    runner.on('suite end', suite => {
        if (suite.root) { return; }

        result += '</ul>';
        result += '</li>';
    });

    runner.on('pass', test => {
        const title = utils.escape(test.title);
        const code = utils.escape(utils.clean(test.body));

        result += `<li class="test pass ${test.speed}">`;
        result += `<h2>${title}<span class="duration">${test.duration}ms</span></h2>`;
        result += `<pre><code>${code}</code></pre>`;
        result += '</li>';
    });

    runner.on('pending', test => {
        const title = utils.escape(test.title);

        result += `<li class="test pass pending">`;
        result += `<h2>${title}</h2>`;
        result += '</li>';
    });

    runner.on('fail', test => {
        const err = test.err;
        const title = utils.escape(test.title);
        const code = utils.escape(utils.clean(test.body));
        const stacktrace = utils.escape(getStacktrace(err));
        const message = utils.escape(getErrorMessage(err));
        const htmlMessage = err.htmlMessage;
        
        result += '<li class="test fail">';
        result += `<h2>${title}</h2>`;
        result += `<pre><code>${code}</code></pre>`;

        if (htmlMessage && stacktrace) {
            result += `<div class="html-error">${htmlMessage}\n<pre class="error">${stacktrace}</pre></div>`;    
        } else if (htmlMessage) {
            result += `<div class="html-error">${htmlMessage}</div>`;    
        } else if (message) {
            result += `<pre class="error">${message}${stacktrace}</pre>`;    
        }

        result += '</li>';
    });
};



