'use strict';

require('mocha');
const path = require('path');
const colors = require('ansi-colors');
const argv = require('minimist')(process.argv.slice(2));
const assert = require('assert');
const picomatch = require('..');
const pm = require('./support');
let sep = path.sep;

/**
 * Some of tests were converted from bash 4.3, 4.4, and minimatch unit tests.
 */

describe('extglobs (minimatch)', () => {
  let setup = { before: () => (path.sep = '\\'), after: () => (path.sep = sep) };
  beforeEach(() => picomatch.clearCache());
  afterEach(() => picomatch.clearCache());
  after(() => (path.sep = sep));

  let offset = 22;
  let fixtures = [
    [['', ''], false],
    [['', '*(0|1|3|5|7|9)'], false],
    [['*(a|b[)', '*(a|b\\[)'], false],
    [['*(a|b[)', '\\*\\(a\\|b\\[\\)'], true],
    [['***', '\\*\\*\\*'], true],
    [['-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'], false],
    [['-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'], true],
    [['-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'], false],
    [['/dev/udp/129.22.8.102/45', '/dev\\/@(tcp|udp)\\/*\\/*'], true],
    [['/x/y/z', '/x/y/z'], true],
    [['0377', '+([0-7])'], true, 'Should match octal numbers'],
    [['07', '+([0-7])'], true, 'Should match octal numbers'],
    [['09', '+([0-7])'], false, 'Should match octal numbers'],
    [['1', '0|[1-9]*([0-9])'], true, 'Should match valid numbers'],
    [['12', '0|[1-9]*([0-9])'], true, 'Should match valid numbers'],
    [['123abc', '(a+|b)*'], false],
    [['123abc', '(a+|b)+'], false],
    [['123abc', '*?(a)bc'], true],
    [['123abc', 'a(b*(foo|bar))d'], false],
    [['123abc', 'ab*(e|f)'], false],
    [['123abc', 'ab**'], false],
    [['123abc', 'ab**(e|f)'], false],
    [['123abc', 'ab**(e|f)g'], false],
    [['123abc', 'ab***ef'], false],
    [['123abc', 'ab*+(e|f)'], false],
    [['123abc', 'ab*d+(e|f)'], false],
    [['123abc', 'ab?*(e|f)'], false],
    [['12abc', '0|[1-9]*([0-9])'], false, 'Should match valid numbers'],
    [['137577991', '*(0|1|3|5|7|9)'], true],
    [['2468', '*(0|1|3|5|7|9)'], false],
    [['?a?b', '\\??\\?b'], true],
    [['\\a\\b\\c', 'abc'], false],
    [['a', '!(*.a|*.b|*.c)'], true],
    [['a', '!(a)'], false],
    [['a', '!(a)*'], false],
    [['a', '(a)'], true],
    [['a', '(b)'], false],
    [['a', '*(a)'], true],
    [['a', '+(a)'], true],
    [['a', '?'], true],
    [['a', '?(a|b)'], true],
    [['a', '??'], false],
    [['a', 'a!(b)*'], true],
    [['a', 'a?(a|b)'], true],
    [['a', 'a?(x)'], true],
    [['a', 'a??b'], false],
    [['a', 'b?(a|b)'], false],
    [['a((((b', 'a(*b'], true],
    [['a((((b', 'a(b'], false],
    [['a((((b', 'a\\(b'], false],
    [['a((b', 'a(*b'], true],
    [['a((b', 'a(b'], false],
    [['a((b', 'a\\(b'], false],
    [['a(b', 'a(*b'], true],
    [['a(b', 'a(b'], true],
    [['a(b', 'a\\(b'], true],
    [['a.', '!(*.a|*.b|*.c)'], true],
    [['a.', '*!(.a|.b|.c)'], true],
    [['a.', '*.!(a)'], true],
    [['a.', '*.!(a|b|c)'], true],
    [['a.', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['a.', '*.+(b|d)'], false],
    [['a.a', '!(*.[a-b]*)'], false],
    [['a.a', '!(*.a|*.b|*.c)'], false],
    [['a.a', '!(*[a-b].[a-b]*)'], false],
    [['a.a', '!*.(a|b)'], false],
    [['a.a', '!*.(a|b)*'], false],
    [['a.a', '(a|d).(a|b)*'], true],
    [['a.a', '(b|a).(a)'], true],
    [['a.a', '*!(.a|.b|.c)'], true],
    [['a.a', '*.!(a)'], false],
    [['a.a', '*.!(a|b|c)'], false],
    [['a.a', '*.(a|b|@(ab|a*@(b))*(c)d)'], true],
    [['a.a', '*.+(b|d)'], false],
    [['a.a', '@(b|a).@(a)'], true],
    [['a.a.a', '!(*.[a-b]*)'], false],
    [['a.a.a', '!(*[a-b].[a-b]*)'], false],
    [['a.a.a', '!*.(a|b)'], false],
    [['a.a.a', '!*.(a|b)*'], false],
    [['a.a.a', '*.!(a)'], true],
    [['a.a.a', '*.+(b|d)'], false],
    [['a.aa.a', '(b|a).(a)'], false],
    [['a.aa.a', '@(b|a).@(a)'], false],
    [['a.abcd', '!(*.a|*.b|*.c)'], true],
    [['a.abcd', '!(*.a|*.b|*.c)*'], false],
    [['a.abcd', '*!(*.a|*.b|*.c)*'], true],
    [['a.abcd', '*!(.a|.b|.c)'], true],
    [['a.abcd', '*.!(a|b|c)'], true],
    [['a.abcd', '*.!(a|b|c)*'], false],
    [['a.abcd', '*.(a|b|@(ab|a*@(b))*(c)d)'], true],
    [['a.b', '!(*.*)'], false],
    [['a.b', '!(*.[a-b]*)'], false],
    [['a.b', '!(*.a|*.b|*.c)'], false],
    [['a.b', '!(*[a-b].[a-b]*)'], false],
    [['a.b', '!*.(a|b)'], false],
    [['a.b', '!*.(a|b)*'], false],
    [['a.b', '(a|d).(a|b)*'], true],
    [['a.b', '*!(.a|.b|.c)'], true],
    [['a.b', '*.!(a)'], true],
    [['a.b', '*.!(a|b|c)'], false],
    [['a.b', '*.(a|b|@(ab|a*@(b))*(c)d)'], true],
    [['a.b', '*.+(b|d)'], true],
    [['a.bb', '!(*.[a-b]*)'], false],
    [['a.bb', '!(*[a-b].[a-b]*)'], false],
    [['a.bb', '!*.(a|b)'], true],
    [['a.bb', '!*.(a|b)*'], false],
    [['a.bb', '!*.*(a|b)'], false],
    [['a.bb', '(a|d).(a|b)*'], true],
    [['a.bb', '(b|a).(a)'], false],
    [['a.bb', '*.+(b|d)'], true],
    [['a.bb', '@(b|a).@(a)'], false],
    [['a.c', '!(*.a|*.b|*.c)'], false],
    [['a.c', '*!(.a|.b|.c)'], true],
    [['a.c', '*.!(a|b|c)'], false],
    [['a.c', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['a.c.d', '!(*.a|*.b|*.c)'], true],
    [['a.c.d', '*!(.a|.b|.c)'], true],
    [['a.c.d', '*.!(a|b|c)'], true],
    [['a.c.d', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['a.ccc', '!(*.[a-b]*)'], true],
    [['a.ccc', '!(*[a-b].[a-b]*)'], true],
    [['a.ccc', '!*.(a|b)'], true],
    [['a.ccc', '!*.(a|b)*'], true],
    [['a.ccc', '*.+(b|d)'], false],
    [['a.js', '!(*.js)'], false],
    [['a.js', '*!(.js)'], true],
    [['a.js', '*.!(js)'], false],
    [['a.js', 'a.!(js)'], false],
    [['a.js', 'a.!(js)*'], false],
    [['a.js.js', '!(*.js)'], false],
    [['a.js.js', '*!(.js)'], true],
    [['a.js.js', '*.!(js)'], true],
    [['a.js.js', '*.*(js).js'], true],
    [['a.md', '!(*.js)'], true],
    [['a.md', '*!(.js)'], true],
    [['a.md', '*.!(js)'], true],
    [['a.md', 'a.!(js)'], true],
    [['a.md', 'a.!(js)*'], true],
    [['a.md.js', '*.*(js).js'], false],
    [['a.txt', 'a.!(js)'], true],
    [['a.txt', 'a.!(js)*'], true],
    [['a/!(z)', 'a/!(z)'], true],
    [['a/b', 'a/!(z)'], true],
    [['a/b/c.txt', '*/b/!(*).txt'], false],
    [['a/b/c.txt', '*/b/!(c).txt'], false],
    [['a/b/c.txt', '*/b/!(cc).txt'], true],
    [['a/b/cc.txt', '*/b/!(*).txt'], false],
    [['a/b/cc.txt', '*/b/!(c).txt'], false],
    [['a/b/cc.txt', '*/b/!(cc).txt'], false],
    [['a/dir/foo.txt', '*/dir/**/!(bar).txt'], true],
    [['a/z', 'a/!(z)'], false],
    [['a\\(b', 'a(*b'], false],
    [['a\\(b', 'a(b'], false],
    [['a\\\\z', 'a\\\\z', { unixify: false }], false],
    [['a\\\\z', 'a\\\\z'], false],
    [['a\\b', 'a/b', { unixify: true }], true],
    [['a\\z', 'a\\\\z', { unixify: false }], true],
    [['a\\z', 'a\\\\z'], false, setup],
    [['aa', '!(a!(b))'], false],
    [['aa', '!(a)'], true],
    [['aa', '!(a)*'], false],
    [['aa', '?'], false],
    [['aa', '@(a)b'], false],
    [['aa', 'a!(b)*'], true],
    [['aa', 'a??b'], false],
    [['aa.aa', '(b|a).(a)'], false],
    [['aa.aa', '@(b|a).@(a)'], false],
    [['aaa', '!(a)*'], false],
    [['aaa', 'a!(b)*'], true],
    [['aaaaaaabababab', '*ab'], true],
    [['aaac', '*(@(a))a@(c)'], true],
    [['aaaz', '[a*(]*z'], true],
    [['aab', '!(a)*'], false],
    [['aab', '?'], false],
    [['aab', '??'], false],
    [['aab', '@(c)b'], false],
    [['aab', 'a!(b)*'], true],
    [['aab', 'a??b'], false],
    [['aac', '*(@(a))a@(c)'], true],
    [['aac', '*(@(a))b@(c)'], false],
    [['aax', 'a!(a*|b)'], false],
    [['aax', 'a!(x*|b)'], true],
    [['aax', 'a?(a*|b)'], true],
    [['aaz', '[a*(]*z'], true],
    [['ab', '!(*.*)'], true],
    [['ab', '!(a!(b))'], true],
    [['ab', '!(a)*'], false],
    [['ab', '(a+|b)*'], true],
    [['ab', '(a+|b)+'], true],
    [['ab', '*?(a)bc'], false],
    [['ab', 'a!(*(b|B))'], false],
    [['ab', 'a!(@(b|B))'], false],
    [['aB', 'a!(@(b|B))'], false],
    [['ab', 'a!(b)*'], false],
    [['ab', 'a(*b'], false],
    [['ab', 'a(b'], false],
    [['ab', 'a(b*(foo|bar))d'], false],
    [['ab', 'a/b', { unixify: true }], false],
    [['ab', 'a\\(b'], false],
    [['ab', 'ab*(e|f)'], true],
    [['ab', 'ab**'], true],
    [['ab', 'ab**(e|f)'], true],
    [['ab', 'ab**(e|f)g'], false],
    [['ab', 'ab***ef'], false],
    [['ab', 'ab*+(e|f)'], false],
    [['ab', 'ab*d+(e|f)'], false],
    [['ab', 'ab?*(e|f)'], false],
    [['ab/cXd/efXg/hi', '**/*X*/**/*i'], true],
    [['ab/cXd/efXg/hi', '*/*X*/*/*i'], true],
    [['ab/cXd/efXg/hi', '*X*i'], false],
    [['ab/cXd/efXg/hi', '*Xg*i'], false],
    [['ab]', 'a!(@(b|B))'], true],
    [['abab', '(a+|b)*'], true],
    [['abab', '(a+|b)+'], true],
    [['abab', '*?(a)bc'], false],
    [['abab', 'a(b*(foo|bar))d'], false],
    [['abab', 'ab*(e|f)'], false],
    [['abab', 'ab**'], true],
    [['abab', 'ab**(e|f)'], true],
    [['abab', 'ab**(e|f)g'], false],
    [['abab', 'ab***ef'], false],
    [['abab', 'ab*+(e|f)'], false],
    [['abab', 'ab*d+(e|f)'], false],
    [['abab', 'ab?*(e|f)'], false],
    [['abb', '!(*.*)'], true],
    [['abb', '!(a)*'], false],
    [['abb', 'a!(b)*'], false],
    [['abbcd', '@(ab|a*(b))*(c)d'], true],
    [['abc', '\\a\\b\\c'], false],
    [['aBc', 'a!(@(b|B))'], true],
    [['abcd', '?@(a|b)*@(c)d'], true],
    [['abcd', '@(ab|a*@(b))*(c)d'], true],
    [['abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t'], true],
    [['abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t'], false],
    [['abcdef', '(a+|b)*'], true],
    [['abcdef', '(a+|b)+'], false],
    [['abcdef', '*?(a)bc'], false],
    [['abcdef', 'a(b*(foo|bar))d'], false],
    [['abcdef', 'ab*(e|f)'], false],
    [['abcdef', 'ab**'], true],
    [['abcdef', 'ab**(e|f)'], true],
    [['abcdef', 'ab**(e|f)g'], false],
    [['abcdef', 'ab***ef'], true],
    [['abcdef', 'ab*+(e|f)'], true],
    [['abcdef', 'ab*d+(e|f)'], true],
    [['abcdef', 'ab?*(e|f)'], false],
    [['abcfef', '(a+|b)*'], true],
    [['abcfef', '(a+|b)+'], false],
    [['abcfef', '*?(a)bc'], false],
    [['abcfef', 'a(b*(foo|bar))d'], false],
    [['abcfef', 'ab*(e|f)'], false],
    [['abcfef', 'ab**'], true],
    [['abcfef', 'ab**(e|f)'], true],
    [['abcfef', 'ab**(e|f)g'], false],
    [['abcfef', 'ab***ef'], true],
    [['abcfef', 'ab*+(e|f)'], true],
    [['abcfef', 'ab*d+(e|f)'], false],
    [['abcfef', 'ab?*(e|f)'], true],
    [['abcfefg', '(a+|b)*'], true],
    [['abcfefg', '(a+|b)+'], false],
    [['abcfefg', '*?(a)bc'], false],
    [['abcfefg', 'a(b*(foo|bar))d'], false],
    [['abcfefg', 'ab*(e|f)'], false],
    [['abcfefg', 'ab**'], true],
    [['abcfefg', 'ab**(e|f)'], true],
    [['abcfefg', 'ab**(e|f)g'], true],
    [['abcfefg', 'ab***ef'], false],
    [['abcfefg', 'ab*+(e|f)'], false],
    [['abcfefg', 'ab*d+(e|f)'], false],
    [['abcfefg', 'ab?*(e|f)'], false],
    [['abcx', '!([[*])*'], true],
    [['abcx', '+(a|b\\[)*'], true],
    [['abcx', '[a*(]*z'], false],
    [['abcXdefXghi', '*X*i'], true],
    [['abcz', '!([[*])*'], true],
    [['abcz', '+(a|b\\[)*'], true],
    [['abcz', '[a*(]*z'], true],
    [['abd', '(a+|b)*'], true],
    [['abd', '(a+|b)+'], false],
    [['abd', '*?(a)bc'], false],
    [['abd', 'a!(*(b|B))'], true],
    [['abd', 'a!(@(b|B))'], true],
    [['abd', 'a!(@(b|B))d'], false],
    [['abd', 'a(b*(foo|bar))d'], true],
    [['abd', 'a+(b|c)d'], true],
    [['abd', 'a[b*(foo|bar)]d'], true],
    [['abd', 'ab*(e|f)'], false],
    [['abd', 'ab**'], true],
    [['abd', 'ab**(e|f)'], true],
    [['abd', 'ab**(e|f)g'], false],
    [['abd', 'ab***ef'], false],
    [['abd', 'ab*+(e|f)'], false],
    [['abd', 'ab*d+(e|f)'], false],
    [['abd', 'ab?*(e|f)'], true],
    [['abef', '(a+|b)*'], true],
    [['abef', '(a+|b)+'], false],
    [['abef', '*(a+|b)'], false],
    [['abef', '*?(a)bc'], false],
    [['abef', 'a(b*(foo|bar))d'], false],
    [['abef', 'ab*(e|f)'], true],
    [['abef', 'ab**'], true],
    [['abef', 'ab**(e|f)'], true],
    [['abef', 'ab**(e|f)g'], false],
    [['abef', 'ab***ef'], true],
    [['abef', 'ab*+(e|f)'], true],
    [['abef', 'ab*d+(e|f)'], false],
    [['abef', 'ab?*(e|f)'], true],
    [['abz', 'a!(*)'], false],
    [['abz', 'a!(z)'], true],
    [['abz', 'a*!(z)'], true],
    [['abz', 'a*(z)'], false],
    [['abz', 'a**(z)'], true],
    [['abz', 'a*@(z)'], true],
    [['abz', 'a+(z)'], false],
    [['abz', 'a?(z)'], false],
    [['abz', 'a@(z)'], false],
    [['ac', '!(a)*'], false],
    [['ac', '*(@(a))a@(c)'], true],
    [['ac', 'a!(*(b|B))'], true],
    [['ac', 'a!(@(b|B))'], true],
    [['ac', 'a!(b)*'], true],
    [['accdef', '(a+|b)*'], true],
    [['accdef', '(a+|b)+'], false],
    [['accdef', '*?(a)bc'], false],
    [['accdef', 'a(b*(foo|bar))d'], false],
    [['accdef', 'ab*(e|f)'], false],
    [['accdef', 'ab**'], false],
    [['accdef', 'ab**(e|f)'], false],
    [['accdef', 'ab**(e|f)g'], false],
    [['accdef', 'ab***ef'], false],
    [['accdef', 'ab*+(e|f)'], false],
    [['accdef', 'ab*d+(e|f)'], false],
    [['accdef', 'ab?*(e|f)'], false],
    [['acd', '(a+|b)*'], true],
    [['acd', '(a+|b)+'], false],
    [['acd', '*?(a)bc'], false],
    [['acd', '@(ab|a*(b))*(c)d'], true],
    [['acd', 'a!(*(b|B))'], true],
    [['acd', 'a!(@(b|B))'], true],
    [['acd', 'a!(@(b|B))d'], true],
    [['acd', 'a(b*(foo|bar))d'], false],
    [['acd', 'a+(b|c)d'], true],
    [['acd', 'a[b*(foo|bar)]d'], false],
    [['acd', 'ab*(e|f)'], false],
    [['acd', 'ab**'], false],
    [['acd', 'ab**(e|f)'], false],
    [['acd', 'ab**(e|f)g'], false],
    [['acd', 'ab***ef'], false],
    [['acd', 'ab*+(e|f)'], false],
    [['acd', 'ab*d+(e|f)'], false],
    [['acd', 'ab?*(e|f)'], false],
    [['ax', '?(a*|b)'], true],
    [['ax', 'a?(b*)'], false],
    [['axz', 'a+(z)'], false],
    [['az', 'a!(*)'], false],
    [['az', 'a!(z)'], false],
    [['az', 'a*!(z)'], true],
    [['az', 'a*(z)'], true],
    [['az', 'a**(z)'], true],
    [['az', 'a*@(z)'], true],
    [['az', 'a+(z)'], true],
    [['az', 'a?(z)'], true],
    [['az', 'a@(z)'], true],
    [['az', 'a\\\\z', { unixify: false }], false],
    [['az', 'a\\\\z'], false],
    [['b', '!(a)*'], true],
    [['b', '(a+|b)*'], true],
    [['b', 'a!(b)*'], false],
    [['b.a', '(b|a).(a)'], true],
    [['b.a', '@(b|a).@(a)'], true],
    [['b/a', '!(b/a)'], false],
    [['b/b', '!(b/a)'], true],
    [['b/c', '!(b/a)'], true],
    [['b/c', 'b/!(c)'], false],
    [['b/c', 'b/!(cc)'], true],
    [['b/c.txt', 'b/!(c).txt'], false],
    [['b/c.txt', 'b/!(cc).txt'], true],
    [['b/cc', 'b/!(c)'], true],
    [['b/cc', 'b/!(cc)'], false],
    [['b/cc.txt', 'b/!(c).txt'], false],
    [['b/cc.txt', 'b/!(cc).txt'], false],
    [['b/ccc', 'b/!(c)'], true],
    [['ba', '!(a!(b))'], true],
    [['ba', 'b?(a|b)'], true],
    [['baaac', '*(@(a))a@(c)'], false],
    [['bar', '!(foo)'], true],
    [['bar', '!(foo)*'], true],
    [['bar', '!(foo)b*'], true],
    [['bar', '*(!(foo))'], true],
    [['baz', '!(foo)*'], true],
    [['baz', '!(foo)b*'], true],
    [['baz', '*(!(foo))'], true],
    [['bb', '!(a!(b))'], true],
    [['bb', '!(a)*'], true],
    [['bb', 'a!(b)*'], false],
    [['bb', 'a?(a|b)'], false],
    [['bbc', '!([[*])*'], true],
    [['bbc', '+(a|b\\[)*'], false],
    [['bbc', '[a*(]*z'], false],
    [['bz', 'a+(z)'], false],
    [['c', '*(@(a))a@(c)'], false],
    [['c.a', '!(*.[a-b]*)'], false],
    [['c.a', '!(*[a-b].[a-b]*)'], true],
    [['c.a', '!*.(a|b)'], false],
    [['c.a', '!*.(a|b)*'], false],
    [['c.a', '(b|a).(a)'], false],
    [['c.a', '*.!(a)'], false],
    [['c.a', '*.+(b|d)'], false],
    [['c.a', '@(b|a).@(a)'], false],
    [['c.c', '!(*.a|*.b|*.c)'], false],
    [['c.c', '*!(.a|.b|.c)'], true],
    [['c.c', '*.!(a|b|c)'], false],
    [['c.c', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['c.ccc', '!(*.[a-b]*)'], true],
    [['c.ccc', '!(*[a-b].[a-b]*)'], true],
    [['c.js', '!(*.js)'], false],
    [['c.js', '*!(.js)'], true],
    [['c.js', '*.!(js)'], false],
    [['c/a/v', 'c/!(z)/v'], true],
    [['c/a/v', 'c/*(z)/v'], false],
    [['c/a/v', 'c/+(z)/v'], false],
    [['c/a/v', 'c/@(z)/v'], false],
    [['c/z/v', '*(z)'], false],
    [['c/z/v', '+(z)'], false],
    [['c/z/v', '?(z)'], false],
    [['c/z/v', 'c/!(z)/v'], false],
    [['c/z/v', 'c/*(z)/v'], true],
    [['c/z/v', 'c/+(z)/v'], true],
    [['c/z/v', 'c/@(z)/v'], true],
    [['c/z/v', 'c/z/v'], true],
    [['cc.a', '(b|a).(a)'], false],
    [['cc.a', '@(b|a).@(a)'], false],
    [['ccc', '!(a)*'], true],
    [['ccc', 'a!(b)*'], false],
    [['cow', '!(*.*)'], true],
    [['cow', '!(*.*).'], false],
    [['cow', '.!(*.*)'], false],
    [['cz', 'a!(*)'], false],
    [['cz', 'a!(z)'], false],
    [['cz', 'a*!(z)'], false],
    [['cz', 'a*(z)'], false],
    [['cz', 'a**(z)'], false],
    [['cz', 'a*@(z)'], false],
    [['cz', 'a+(z)'], false],
    [['cz', 'a?(z)'], false],
    [['cz', 'a@(z)'], false],
    [['d.a.d', '!(*.[a-b]*)'], false],
    [['d.a.d', '!(*[a-b].[a-b]*)'], true],
    [['d.a.d', '!*.(a|b)*'], false],
    [['d.a.d', '!*.*(a|b)'], true],
    [['d.a.d', '!*.{a,b}*'], false],
    [['d.a.d', '*.!(a)'], true],
    [['d.a.d', '*.+(b|d)'], true],
    [['d.d', '!(*.a|*.b|*.c)'], true],
    [['d.d', '*!(.a|.b|.c)'], true],
    [['d.d', '*.!(a|b|c)'], true],
    [['d.d', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['d.js.d', '!(*.js)'], true],
    [['d.js.d', '*!(.js)'], true],
    [['d.js.d', '*.!(js)'], true],
    [['dd.aa.d', '(b|a).(a)'], false],
    [['dd.aa.d', '@(b|a).@(a)'], false],
    [['def', '()ef'], false],
    [['e.e', '!(*.a|*.b|*.c)'], true],
    [['e.e', '*!(.a|.b|.c)'], true],
    [['e.e', '*.!(a|b|c)'], true],
    [['e.e', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['ef', '()ef'], true],
    [['effgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))'], true],
    [['efgz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))'], true],
    [['egz', '@(b+(c)d|e*(f)g?|?(h)i@(j|k))'], true],
    [['egz', '@(b+(c)d|e+(f)g?|?(h)i@(j|k))'], false],
    [['egzefffgzbcdij', '*(b+(c)d|e*(f)g?|?(h)i@(j|k))'], true],
    [['f', '!(f!(o))'], false],
    [['f', '!(f(o))'], true],
    [['f', '!(f)'], false],
    [['f', '*(!(f))'], false],
    [['f', '+(!(f))'], false],
    [['f.a', '!(*.a|*.b|*.c)'], false],
    [['f.a', '*!(.a|.b|.c)'], true],
    [['f.a', '*.!(a|b|c)'], false],
    [['f.f', '!(*.a|*.b|*.c)'], true],
    [['f.f', '*!(.a|.b|.c)'], true],
    [['f.f', '*.!(a|b|c)'], true],
    [['f.f', '*.(a|b|@(ab|a*@(b))*(c)d)'], false],
    [['fa', '!(f!(o))'], false],
    [['fa', '!(f(o))'], true],
    [['fb', '!(f!(o))'], false],
    [['fb', '!(f(o))'], true],
    [['fff', '!(f)'], true],
    [['fff', '*(!(f))'], true],
    [['fff', '+(!(f))'], true],
    [['fffooofoooooffoofffooofff', '*(*(f)*(o))'], true],
    [['ffo', '*(f*(o))'], true],
    [['file.C', '*.c?(c)'], false],
    [['file.c', '*.c?(c)'], true],
    [['file.cc', '*.c?(c)'], true],
    [['file.ccc', '*.c?(c)'], false],
    [['fo', '!(f!(o))'], true],
    [['fo', '!(f(o))'], false],
    [['fofo', '*(f*(o))'], true],
    [['fofoofoofofoo', '*(fo|foo)'], true, 'Should backtrack in alternation matches'],
    [['fofoofoofofoo', '*(fo|foo)'], true],
    [['foo', '!(!(foo))'], true],
    [['foo', '!(f)'], true],
    [['foo', '!(foo)'], false],
    [['foo', '!(foo)*'], false],
    [['foo', '!(foo)*'], false], // bash 4.3 disagrees
    [['foo', '!(foo)+'], false],
    [['foo', '!(foo)b*'], false],
    [['foo', '!(x)'], true],
    [['foo', '!(x)*'], true],
    [['foo', '*'], true],
    [['foo', '*(!(f))'], true],
    [['foo', '*(!(foo))'], false],
    [['foo', '*(@(a))a@(c)'], false],
    [['foo', '*(@(foo))'], true],
    [['foo', '*(a|b\\[)'], false],
    [['foo', '*(a|b\\[)|f*'], true],
    [['foo', '@(*(a|b\\[)|f*)'], true],
    [['foo', '*/*/*'], false],
    [['foo', '*f'], false],
    [['foo', '*foo*'], true],
    [['foo', '+(!(f))'], true],
    [['foo', '??'], false],
    [['foo', '???'], true],
    [['foo', 'bar'], false],
    [['foo', 'f*'], true],
    [['foo', 'fo'], false],
    [['foo', 'foo'], true],
    [['foo', '{*(a|b\\[),f*}'], true],
    [['foo*', 'foo\\*', { unixify: false }], true],
    [['foo*bar', 'foo\\*bar'], true],
    [['foo.js', '!(foo).js'], false],
    [['foo.js.js', '*.!(js)'], true],
    [['foo.js.js', '*.!(js)*'], false],
    [['foo.js.js', '*.!(js)*.!(js)'], false],
    [['foo.js.js', '*.!(js)+'], false],
    [['foo.txt', '**/!(bar).txt'], true],
    [['foo/bar', '*/*/*'], false],
    [['foo/bar', 'foo/!(foo)'], true],
    [['foo/bar', 'foo/*'], true],
    [['foo/bar', 'foo/bar'], true],
    [['foo/bar', 'foo?bar'], false],
    [['foo/bar', 'foo[/]bar'], true],
    [['foo/bar/baz.jsx', 'foo/bar/**/*.+(js|jsx)'], true],
    [['foo/bar/baz.jsx', 'foo/bar/*.+(js|jsx)'], true],
    [['foo/bb/aa/rr', '**/**/**'], true],
    [['foo/bb/aa/rr', '*/*/*'], false],
    [['foo/bba/arr', '*/*/*'], true],
    [['foo/bba/arr', 'foo*'], false], // bash disagrees when "globstar" is disabled
    [['foo/bba/arr', 'foo**'], false], // bash disagrees when "globstar" is disabled
    [['foo/bba/arr', 'foo/*'], false], // bash disagrees when "globstar" is disabled
    [['foo/bba/arr', 'foo/**'], true],
    [['foo/bba/arr', 'foo/**arr'], false], // bash disagrees when "globstar" is disabled
    [['foo/bba/arr', 'foo/**z'], false],
    [['foo/bba/arr', 'foo/*arr'], false], // bash disagrees when "globstar" is disabled
    [['foo/bba/arr', 'foo/*z'], false],
    [['foob', '!(foo)b*'], false],
    [['foob', '(foo)bb'], false],
    [['foobar', '!(foo)'], true],
    [['foobar', '!(foo)*'], false], // bash 4.3 disagrees
    // [['foobar', '!(foo)*'], false], // bash 4.3 disagrees
    [['foobar', '!(foo)b*'], false],
    [['foobar', '*(!(foo))'], true],
    [['foobar', '*ob*a*r*'], true],
    [['foobar', 'foo\\*bar'], false], // bash 4.3 disagrees since bash does not respect the escaped star
    [['foobb', '!(foo)b*'], false], // bash 4.3 disagrees, since (in bash) the last star greedily captures everything. IMHO, this is a bug in bash.
    [['foobb', '(foo)bb'], true], // bash 4.3 disagrees, since non-extglob parens have significance in bash
    [['(foo)bb', '\\(foo\\)bb'], true], // bash 4.3 disagrees, since the escaping is not respected
    [['foofoofo', '@(foo|f|fo)*(f|of+(o))'], true, 'Should match as fo+ofo+ofo'],
    [['foofoofo', '@(foo|f|fo)*(f|of+(o))'], true],
    [['fooofoofofooo', '*(f*(o))'], true],
    [['foooofo', '*(f*(o))'], true],
    [['foooofof', '*(f*(o))'], true],
    [['foooofof', '*(f+(o))'], false],
    [['foooofofx', '*(f*(o))'], false],
    [['foooxfooxfoxfooox', '*(f*(o)x)'], true],
    [['foooxfooxfxfooox', '*(f*(o)x)'], true],
    [['foooxfooxofoxfooox', '*(f*(o)x)'], false],
    [['foot', '@(!(z*)|*x)'], true],
    [['foox', '@(!(z*)|*x)'], true],
    [['fz', '*(z)'], false],
    [['fz', '+(z)'], false],
    [['fz', '?(z)'], false],
    [['moo.cow', '!(moo).!(cow)'], false],
    [['moo.cow', '!(*).!(*)'], false],
    [['mad.moo.cow', '!(*.*).!(*.*)'], false],
    [['mad.moo.cow', '.!(*.*)'], false],
    [['Makefile', '!(*.c|*.h|Makefile.in|config*|README)'], true],
    [['Makefile.in', '!(*.c|*.h|Makefile.in|config*|README)'], false],
    [['moo', '!(*.*)'], true],
    [['moo', '!(*.*).'], false],
    [['moo', '.!(*.*)'], false],
    [['moo.cow', '!(*.*)'], false],
    [['moo.cow', '!(*.*).'], false],
    [['moo.cow', '.!(*.*)'], false],
    [['mucca.pazza', 'mu!(*(c))?.pa!(*(z))?'], false],
    [['ofoofo', '*(of+(o))'], true],
    [['ofoofo', '*(of+(o)|f)'], true],
    [['ofooofoofofooo', '*(f*(o))'], false],
    [['ofoooxoofxo', '*(*(of*(o)x)o)'], true],
    [['ofoooxoofxoofoooxoofxo', '*(*(of*(o)x)o)'], true],
    [['ofoooxoofxoofoooxoofxofo', '*(*(of*(o)x)o)'], false],
    [['ofoooxoofxoofoooxoofxoo', '*(*(of*(o)x)o)'], true],
    [['ofoooxoofxoofoooxoofxooofxofxo', '*(*(of*(o)x)o)'], true],
    [['ofxoofxo', '*(*(of*(o)x)o)'], true],
    [['oofooofo', '*(of|oof+(o))'], true],
    [['ooo', '!(f)'], true],
    [['ooo', '*(!(f))'], true],
    [['ooo', '+(!(f))'], true],
    [['oxfoxfox', '*(oxf+(ox))'], false],
    [['oxfoxoxfox', '*(oxf+(ox))'], true],
    [['para', 'para*([0-9])'], true],
    [['para', 'para+([0-9])'], false],
    [['para.38', 'para!(*.[00-09])'], true],
    [['para.graph', 'para!(*.[0-9])'], true],
    [['para13829383746592', 'para*([0-9])'], true],
    [['para381', 'para?([345]|99)1'], false],
    [['para39', 'para!(*.[0-9])'], true],
    [['para987346523', 'para+([0-9])'], true],
    [['para991', 'para?([345]|99)1'], true],
    [['paragraph', 'para!(*.[0-9])'], true],
    [['paragraph', 'para*([0-9])'], false],
    [['paragraph', 'para@(chute|graph)'], true],
    [['paramour', 'para@(chute|graph)'], false],
    [['parse.y', '!(*.c|*.h|Makefile.in|config*|README)'], true],
    [['shell.c', '!(*.c|*.h|Makefile.in|config*|README)'], false],
    [['VMS.FILE;', '*\\;[1-9]*([0-9])'], false],
    [['VMS.FILE;0', '*\\;[1-9]*([0-9])'], false],
    [['VMS.FILE;1', '*\\;[1-9]*([0-9])'], true], // bash 4.3 disagrees b/c of ";" in terminal usage
    [['VMS.FILE;1', '*;[1-9]*([0-9])'], true], // bash 4.3 disagrees b/c of ";" in terminal usage
    [['VMS.FILE;139', '*\\;[1-9]*([0-9])'], true], // bash 4.3 disagrees b/c of ";" in terminal usage
    [['VMS.FILE;1N', '*\\;[1-9]*([0-9])'], false],
    [['xfoooofof', '*(f*(o))'], false],
    [['XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*', { unixify: false } ], true ],
    [['XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*'], false],
    [['z', '*(z)'], true],
    [['z', '+(z)'], true],
    [['z', '?(z)'], true],
    [['zf', '*(z)'], false],
    [['zf', '+(z)'], false],
    [['zf', '?(z)'], false],
    [['zoot', '@(!(z*)|*x)'], false],
    [['zoox', '@(!(z*)|*x)'], true],
    [['zz', '(a+|b)*'], false]
  ];

  fixtures.forEach((unit, i) => {
    let n = i + offset; // add offset so line no. is correct in error messages
    if (argv.n !== void 0 && n !== argv.n) return;
    let args = unit[0];
    let expected = unit[1];
    let setup = unit[2];
    let errMessage = `${colors.cyan('Line ' + n)}) ${colors.yellow(args[0])} should ${colors.red(expected ? '' : 'not ')}match ${colors.yellow(args[1])}`;

    it(`"${args[0]}" should ${expected ? '' : 'not '}match "${args[1]}"`, () => {
      // console.log(bash.isMatch(...args))
      if (setup && setup.before) setup.before();
      assert.equal(pm.isMatch(...args), expected, errMessage);
      if (setup && setup.after) setup.after();
    });
  });
});
