[![Build Status](https://travis-ci.org/metaodi/cabdriver.svg?branch=master)](https://travis-ci.org/metaodi/cabdriver)
[![Coverage Status](https://coveralls.io/repos/github/metaodi/cabdriver/badge.svg?branch=master)](https://coveralls.io/github/metaodi/cabdriver?branch=master)

cabdriver
=========

cabdriver is a small helper application that helps you to fill in your hours in [taxi](https://github.com/sephii/taxi).
It currently support various sources (see below) to get entries in a taxi-friendly format.

## Content

* [Installation](#installation)
* [Usage](#usage)
   * [Google Calendar](#google-calendar) (default)
   * [Google Mail](#google-mail)
   * [Slack](#slack)
   * [Jira](#jira)
   * [Local git repositories](#git)
   * [Github](#github)
   * [Gitlab](#gitlab)
   * [Zebra](#zebra)
   * [Logbot](#logbot)
* [Configuration File](#configuration-file)
* [Tests](#tests)
* [Release](#release)

## Installation

Make sure you have [Node.js](https://nodejs.org/en/) >= 6.11.0 installed.

To check the node version number, use the following command:

```bash
node --version
```

Install `cabdriver` globally:
```bash
npm install -g cabdriver
```

By installing cabdriver globally, you get both `cabdriver` and the shorter `cab` command to call this tool.

## Usage

cabdriver has several commands available, `fetch` is the default command.

```
$ cabdriver <command> [options]
```

Example: 

```
$ cabdriver fetch -d today
```

Or shorter:

```
$ cab -d today
```

### `fetch` command

```bash
$ cabdriver -n 10 -d yesterday

02/02/2016 # Tuesday
xxx    09:00-10:00   Go-Live Planning
xxx    09:30-09:45   Jazz Daily Stand-Up
xxx    10:05-10:30   Weiteres Vorgehen Staging
xxx    13:30-14:00   IPA-Besprechung
xxx    16:00-19:00   Byebye Apero Lukas

03/02/2016 # Wednesday
xxx    09:30-09:45   Jazz Daily Stand-Up
xxx    10:00-10:30   Support Backlog
xxx    10:45-11:45   Sprint 3 Planning 2
```

```bash
$ cabdriver --hours -d 03.02.2016

03/02/2016 # Wednesday
xxx    0.25 Jazz Daily Stand-Up
xxx    0.5  Support Backlog
xxx    1    Sprint 3 Planning 2
```


### Entries from 01.03.2016 until 05.03.2016, max. 100 results
```bash
$ cabdriver -d 01.03.2016-05.03.2016 -n 100
```

### Google Calendar

```bash
$ cabdriver --calendar
```

This uses the primary calendar associated with the Google account.

But you can specify another one, if you want (check the "Calendar ID" on the settings page):

```bash
$ cabdriver --calendar private@example.com
```

### Google Mail

```bash
$ cabdriver --mail
```

To configure the output of the mail source, [see the section below how to tweak the mail query in the config file](#configure-query-and-labels-for-mails).

### Slack

Text entries:
```bash
$ cabdriver --slack
```

Graphic (pie chart):
```bash
$ cabdriver --slack --pie
```
[![cabdriver with slack pie chart](http://i.imgur.com/KcPgjcU.png)](#)

### Jira

Note: the Liip-specific Jira instance is pre-defined as host.

```bash
$ cabdriver --jira
```

Unfortunately the JIRA API does not provide the activitiy stream of a user, so that the issue search is used to find recently updated issues, that are related to the logged in user.
In those issues the changelog and worklog are evaluated to generate taxi entries.

### Git

Find my commits in all git repositories in `/home/odi/projects`:
```bash
$ cabdriver -g /home/odi/projects
```

If you omit the path all git repositories in the current working directory (recursively) are used.
Depending on the size of your file system, this might take some time.
You can use `--verbose` to get an indicator of the progress.

```bash
$ cabdriver -g --verbose
```

### Zebra

Find zebra entries that you've already committed:
```bash
$ cabdriver -z -d last-week
```

Pie chart:
```bash
$ cabdriver -z -p
```

This might be helpful to get a double check of the entries that are already in Zebra and to see if something is missing or to update your local taxi file with entries that you made on the web interface of Zebra.
Because all those entries were already commited to zebra, they are commted out by default.

### Github

Generate entries based on GitHub activity this week:

```
$ cabdriver --github -d this-week
```

### Gitlab

Generate entries based on GitLab activity:

```
$ cabdriver --gitlab
```

Note: GitLab API v4 is required (prefered API version since GitLab 9.0)

### Logbot

Find entries from [Logbot](https://github.com/metaodi/logbot):
```
$ cabdriver -l
```

### Options

For a complete help run `cabdriver --help`.

* `-n --number` number of entries to return (default: 250)
* `-d --date` supports date strings or ranges (default: today):
  * 31.12.2016
  * 01.12.2016-31.12.2016
  * yesterday
  * last-week
  * past-week (7 days)
  * last-month (month before the current)
  * past-month (30 days)
  * last-year (year before the current)
  * past-year (365 days)
  * today (up to current time)
  * this-week (up to current time)
  * this-month (up to current time)
  * this-year (up to current time)
* `-c --calendar` choose the calendar for the entries (default: primary)
* `-m --mail` generate entries from mails
* `-s --slack` generate entries from slack
* `-l --logbot` generate entries from logbot
* `-j --jira` generate entries from jira
* `-z --zebra` generate entries from zebra
* `-g --git <path>` generate entries from your local git repositories (defaults to current directory)
* `-G --github` generate entries from github activities
* `-L --gitlab` generate entries from gitlab activities
* `-p --pie` generate pie chart instead of text (currently only for slack and zebra)
* `-H --hours` prefer output in hours instead of start/end date
* `-v --verbose` verbose output

### `sheet` command

To generate empty taxi files (e.g. at the beginning of the month), you can use the `sheet` command:

```
$ cabdriver sheet
```

Without any options, a sheet for the current month is generated.

To generate sheet for other months, use the `-m` (month) and/or `-y` (year) options:

```
$ cabdriver sheet -m this-month # current month
$ cabdriver sheet -m next-month # next month
$ cabdriver sheet -m 3 # March of current year
$ cabdriver sheet -m feb # February of current year
$ cabdriver sheet -m 13 # January of next year, numbers >12 will overflow to the following year
$ cabdriver sheet -m 6 -y 2019 # June of 2019
```

## Configuration File

The config file is a YAML file, which by default is in your home directory under `~/.cabdriver/cabdriver.yml`.
You can use the `-C`/`--config` CLI argument to specify a non-default location of the config file.

### Default values (`defaults`)

Instead of typing all options, you can specify your default options in the config file. The file looks like this:

```yaml
defaults:
    jira: true
    slack: true
    calendar: primary
    zebra: false
    git: /home/metaodi
    github: true
    gitlab: true
```

If you have the config file in place and you type `cabdriver` these values will be applied.
You can use all comand line options in config file, simply use their long name.

**NOTE: if you specify a source on the command line, the config file is not used, e.g. with `cabdriver -z` will only list zebra entries**

The `defaults` key in the config file is really just meant as a place to write down your default values.

### Custom project mapping (`mapping`)

cabdriver extracts the project name/alias for each source (e.g. the repository name for the `git` source, or project name for `jira`).
In many cases it's not easily possible to extract the correct alias from the source.
Instead of manually fixing all those entries, you can define a mapping in the config file.

Here is an example:

```yaml
mapping:
    acme_dev:
        - 'dev'
    _internal:
        - 'Meeting'
        - 'Internal'
        - 'dev'
    _liiptalk:
        - 'Liip.*Talk'
    __comment__:
        - 'Lunch'
    __remove__:
        - 'Hours!'
```

As you can see, you can define a list of patterns (acutally a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)) for each alias.
In the above example, entries with "Meeting" or "Internal" in the project or text field will be mapped to `_internal`.

Some notes:
- all matches are done _case-insensitive_ (using the [`i` flag of RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp))
- list as many patterns as you want, if _any_ matches, the project will be mapped
- Each entry will only be mapped **once** (except for the special keys mention below), i.e. if one match was found, no further matches will be searched (in the example above: entires that match `dev` will be mapped to `acme_dev` and never to `_internal`). So place more specific patterns on top and more general patterns on the bottom.
- The special key `__comment__` is used to match entries that will be commented out in the final output (by prefixing them with a `#` character) 
- The special key `__remove__` is used to match entries that will be removed from the final output. In the `--verbose` mode, these entries will be commented out and marked with `[REMOVED]`
- Consider all keys starting and ending with a double underscore to be special

### Cache

Some intermediate results are cached locally to improve the overall performance of cabdriver.
It's possible to tweak the cache settings in the config file:

```yaml
cache:
    hours: 2
    path: /home/myuser/cache
```

The `hours` option specifies the amount of hours the results are cached (default: `1`).
With the `path` option, the location of the cache files can be changed (default: `~/.cabdriver/cache`)


### Configure query and labels for mails

Gmail, which is used as the mail source of cabdriver, allows assign labels to mails and further has [fairly powerful query language](https://support.google.com/mail/answer/7190?hl=en) to search for emails.
By default, `cabdriver` will simply return all emails in the specified time range.
In the config file you can change this behavior using 3 different method (they can be combined):

* **`include`**: Define a list of labels that should be searched. Note that if you specify labels here, only emails having those labels will be returned
* **`exclude`**: Define a list of labels that should be excluded from the results, so only mails that do not have these labels will be returned
* **`query`**: This is a string to define your own custom query (e.g. `is:unread` to only return unread emails).

Here is a complete example of a mail configuration:

```yaml
mail:
    include:
        - Jira
        - Education
    exclude:
        - Notification
        - Newsletter
    query: -to:team@liip.ch
```

It's possible to omit keys that are not needed (i.e. only use `exclude`) or combine them. The above example would return all emails that have the label "Jira" or "Education", but not the label "Notification" or "Newsletter", mails sent to `team@liip.ch` would be excluded as well.

## Tests

To run the tests use the following command:

```bash
npm test
```

## Release

To create a new release follow these steps:

1. Update the version number in `package.json`
1. Update the `CHANGELOG.md`
1. Create a [new release/tag on GitHub](https://github.com/metaodi/cabdriver/releases)
1. The tagged release will automatically be published on NPM by Travis CI (to do it manually, run `npm publish`)
