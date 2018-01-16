# NPM Scent

[![NPM](https://img.shields.io/npm/v/scavenger-scent-npm.svg)](https://npmjs.org/packages/scavenger-scent-npm/)
[![Travis CI](https://img.shields.io/travis/temando/scavenger-scent-npm.svg)](https://travis-ci.org/temando/scavenger-scent-npm)
[![MIT License](https://img.shields.io/github/license/temando/scavenger-scent-npm.svg)](https://en.wikipedia.org/wiki/MIT_License)

A scent for [Scavenger](https://github.com/temando/scavenger-cli)'s `scout` command, which retrieves project information from NPM.

## Installation

```sh
$ npm install -g scavenger scavenger-scent-npm
```

## Using NPM Scent

This scent is usually invoked from Scavenger's `scout` command:

```bash
$ scavenger scout npm <username> [keywords]
```

- `<username>` Your NPM username, or team name.
- `[keywords]` Filter projects against their `package.json` `keywords` property. Specify multiple keywords with a comma.

This scent will retrieve details of projects the specified username has access to in NPM. The `scout` command is responsible for writing these details into a format that can be used by other `scavenger` commands such as `fetch` or `thieve`.
