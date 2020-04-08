mocha-simple-html-reporter
==========================

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Dependency Status][david-img]][david]

[npm]:          https://www.npmjs.org/package/mocha-simple-html-reporter
[npm-img]:      https://img.shields.io/npm/v/mocha-simple-html-reporter.svg

[travis]:       https://travis-ci.org/blond/mocha-simple-html-reporter
[test-img]:     https://img.shields.io/travis/blond/mocha-simple-html-reporter/master.svg?label=tests

[david]:        https://david-dm.org/blond/mocha-simple-html-reporter
[david-img]:    https://img.shields.io/david/blond/mocha-simple-html-reporter/master.svg?style=flat

This is a custom reporter for use with the Javascript testing framework, [mocha](http://mochajs.org/). It generates a HTML/CSS report that helps visualize your test suites.

Sample Report
-------------

![Sample Report](./report.gif)

Install
-------

```
$ npm install --save-dev mocha-simple-html-reporter
```

Usage
-----

Tell mocha to use this reporter:

```shell
$ mocha testfile.js --reporter mocha-simple-html-reporter --reporter-options output=report.html
```

By default, it will output to the console. To write directly to a file, use `--reporter-options output=filename.html`.

Related
-------

* [mocha-html-reporter](https://github.com/HermannPencole/mocha-html-reporter) — reporter with original Mocha-style.
* [good-mocha-html-reporter](https://github.com/Gauge/html_table_reporter) — reporter with custom style.
* [mochawesome](https://github.com/adamgruber/mochawesome) — builds user-friendly report with percentage, charts and navigation menu.

FAQ
---

### Why not use original HTML reporter?

> The HTML reporter is currently the only browser reporter supported by Mocha.

It means that original HTML reporter not building HTML report. It run tests in browser.

### Why not use `mocha-html-reporter` package?

The `mocha-html-reporter` package has the following problems:

* It not able report about failures only. If your project has many tests, it is difficult to find the error among thousands of passed tests.
* It able to return HTML-report only in console. There is no way to write to a file if your tests writing something to `stdout`.
* It requires concatenating result with `head.html` and `tail.html` to build report with styles and scripts.
* You can't move file with HTML report: styles link to CSS-file in `node_modules`.
* It does not show execution time for slow tests.
* It requires `jQuery`.

### Why not use `mochawesome` package?

The `mochawesome` package feels very comfortable, but html page will be quite slow for lots of tests.

Besides the interface is different from the original. For some, it may be important.

License
-------

MIT © [Andrew Abramov](https://github.com/blond)
