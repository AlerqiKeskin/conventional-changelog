'use strict';
var conventionalCommitsParser = require('../');
var expect = require('chai').expect;
var forEach = require('lodash').forEach;
var through = require('through2');

describe('conventionalCommitsParser', function() {
  it('should parse raw commits', function(done) {
    var stream = through();
    var commits = [
      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'feat(ng-list): Allow custom separator\n' +
      'bla bla bla\n\n' +
      'Closes #123\nCloses #25\nFixes #33\n',

      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'feat(ng-list): Allow custom separator\n' +
      'bla bla bla\n\n' +
      'BREAKING CHANGE: some breaking change\n',

      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'fix(zzz): Very cool commit\n' +
      'bla bla bla\n\n' +
      'Closes #2, #3. Resolves #4. Fixes #5. Fixes #6.\n' +
      'What not ?\n',

      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'chore(scope with spaces): some chore\n' +
      'bla bla bla\n\n' +
      'BREAKING CHANGE: some breaking change\n'
    ];

    forEach(commits, function(commit) {
      stream.write(commit);
    });
    stream.end();

    var length = commits.length;

    stream
      .pipe(conventionalCommitsParser())
      .pipe(through.obj(function(chunk, enc, cb) {
        expect(chunk.hash).to.equal('13f31602f396bc269076ab4d389cfd8ca94b20ba');
        if (--length === 0) {
          done();
        }
        cb();
      }));
  });

  it('should ignore malformed commits', function(done) {
    var stream = through();
    var commits = [
      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'chore(scope with spaces): some chore\n',

      '\n' +
      'bla bla bla\n\n' +
      'Closes #123\nCloses #25\nFixes #33\n',

      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'fix(zzz): Very cool commit\n' +
      'bla bla bla\n\n'
    ];

    forEach(commits, function(commit) {
      stream.write(commit);
    });
    stream.end();

    var i = 0;

    stream
      .pipe(conventionalCommitsParser())
      .pipe(through.obj(function(chunk, enc, cb) {
        expect(chunk.hash).to.equal('13f31602f396bc269076ab4d389cfd8ca94b20ba');
        i++;
        cb();
      }, function() {
        expect(i).to.equal(2);
        done();
      }));
  });

  it('should take options', function(done) {
    var stream = through();
    var commits = [
      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'feat(ng-list): Allow custom separator\n' +
      'bla bla bla\n\n' +
      'Fix #123\nCloses #25\nfix #33\n',

      '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
      'feat(ng-list): Allow custom separator\n' +
      'bla bla bla\n\n' +
      'BREAKING CHANGES: some breaking changes\n',
    ];

    forEach(commits, function(commit) {
      stream.write(commit);
    });
    stream.end();

    var length = commits.length;

    stream
      .pipe(conventionalCommitsParser({
        closeKeywords: 'fix',
        breakKeywords: 'BREAKING CHANGES'
      }))
      .pipe(through.obj(function(chunk, enc, cb) {
        if (--length === 1) {
          expect(chunk.closes).to.eql([123, 33]);
        } else {
          expect(chunk.breaks['BREAKING CHANGES']).to.equal('some breaking changes');
          done();
        }
        cb();
      }));
  });
});
