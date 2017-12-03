const BroccoliTestHelper = require('broccoli-test-helper');
const createTempDir = BroccoliTestHelper.createTempDir;
const co = require('co');
const fs = require('fs');
const path = require('path');
const stripIndent = require('common-tags').stripIndent;

const CSSInjector = require('../../lib/css_injector.js');

const test = QUnit.test;

QUnit.module('CSSInjector', function(hooks) {
  let input, output;

  hooks.beforeEach(co.wrap(function* () {
    input = yield createTempDir();
    output = yield createTempDir();
  }));

  hooks.afterEach(co.wrap(function* () {
    yield input.dispose();
    yield output.dispose();
  }));

  test('injects css only for files specified as filePathsToInject argument', function(assert) {
    let fixture = {
      'assets': {
        'vendor.css': 'a { background-color: blue; }',
        'app.css': 'h1 { background-color: green; }'
      },
      'index.html': stripIndent`
        <link rel="stylesheet" href="/assets/vendor.css">
        <link rel="stylesheet" href="/assets/app.css">
      `
    };
    input.write(fixture);

    let injector = new CSSInjector({
      rootPath: input.path(),
      filePathsToInject: [ 'assets/vendor.css' ]
    });

    injector.write(path.join(output.path(), 'index.html'))

    assert.equal(output.read()['index.html'], `<style>a { background-color: blue; }</style>\n<link rel=\"stylesheet\" href=\"/assets/app.css\">`);
  });

  test('matches link tags with any attributes', function(assert) {
    let fixture = {
      'assets': {
        'vendor.css': 'a { background-color: blue; }',
        'app.css': 'h1 { background-color: green; }'
      },
      'index.html': stripIndent`
        <link type="text/css" rel="stylesheet" href="/assets/vendor.css">
        <link integrity="" rel="stylesheet" href="/assets/app.css">
      `
    };
    input.write(fixture);

    let injector = new CSSInjector({
      rootPath: input.path(),
      filePathsToInject: [ 'assets/vendor.css', 'assets/app.css' ]
    });

    injector.write(path.join(output.path(), 'index.html'))

    assert.equal(output.read()['index.html'], `<style>a { background-color: blue; }</style>\n<style>h1 { background-color: green; }</style>`);
  });

  test('correctly matches and replaces the fingerprinted assets', function(assert) {
    let fixture = {
      'assets': {
        'vendor-b0ce5ac89cccf9dc5bda310681781580.css': 'fingerPrint.a { background-color: yellow; }',
        'app-72a6fc39b9724b925f38c875f5aacd57.css': 'fingerPrint.h1 { background-color: green; }'
      },
      'index.html': stripIndent`
        <link type="text/css" rel="stylesheet" href="/assets/vendor-b0ce5ac89cccf9dc5bda310681781580.css">
        <link integrity="" rel="stylesheet" href="/assets/app-72a6fc39b9724b925f38c875f5aacd57.css">
      `
    };
    input.write(fixture);

    let injector = new CSSInjector({
      rootPath: input.path(),
      filePathsToInject: [ 'assets/vendor.css', 'assets/app.css' ]
    });

    injector.write(path.join(output.path(), 'index.html'))

    assert.equal(output.read()['index.html'], `<style>fingerPrint.a { background-color: yellow; }</style>\n<style>fingerPrint.h1 { background-color: green; }</style>`);
  });
});
