"use strict";

const {google} = require('googleapis');
var Moment = require('moment-timezone');
var Promise = require('bluebird');
var Async = require('promise-async');
var _ = require('lodash');

var helper = require('../helper');
var Source = require('./source');

class GoogleMail extends Source {
    constructor(options, auth) {
        super(options, auth);
        this.type = 'mail';
    }

    generateEntries(auth, config) {
        var me = this;

        config = config || {};
        var mailConfig = me.getMailConfig(config);

        var mailArgs = {
            userId: 'me'
        };
        mailArgs['maxResults'] = me.options.count || 10;

        mailArgs['q'] = mailConfig.query;

        _.each(mailConfig.include, function(label, index) {
            if (index === 0) {
                mailArgs['q'] += ' (label:' + label;
            } else {
                mailArgs['q'] += ' OR label:' + label;
            }
            if (index === mailConfig.include.length - 1) {
                mailArgs['q'] += ')';
            }

        });
        _.each(mailConfig.exclude, function(label) {
            mailArgs['q'] += ' -label:' + label;
        });


        var afterDate = Moment.tz(me.options.startDate, 'Europe/Zurich') || Moment().tz('Europe/Zurich');
        mailArgs['q'] += ' after:' + afterDate.subtract(1, 'd').endOf('day').format('X');

        if (me.options.endDate) {
            mailArgs['q'] += ' before:' + Moment.tz(me.options.endDate, 'Europe/Zurich').add(1, 'd').startOf('day').format('X');
        }

        helper.logVerbose("Fetching mails: " + mailArgs['q'], me.options.verbose);
        return me.getAllMessages(mailArgs, auth)
            .then(function(allMessages) {
                return Async.mapLimit(
                    allMessages,
                    5,
                    function(msg, callback) {
                        helper.printVerbose("=", me.options.verbose);
                        return me.handleMessage(auth, msg, callback);
                    });
            })
            .then(function(results) {
                helper.printVerbose("]\n", me.options.verbose);
                return results.reverse();
            })
            .catch(function(err) {
                throw new Error('The Google Mail API returned an error: ' + err);
            });
    }

    getAllMessages(mailArgs, auth) {
        var me = this;
        var allMessages = [];

        const mail = google.gmail({
            version: 'v1',
            auth: auth
        });

        function pager(res) {
            helper.printVerbose('.', me.options.verbose);
            if (res.data.messages) {
                allMessages = allMessages.concat(res.data.messages);
            }
            if (res.data.nextPageToken) {
                mailArgs['pageToken'] = res.data.nextPageToken;
                return mail.users.messages.list(_.clone(mailArgs)).then(pager);
            }
            return allMessages;
        }

        helper.printVerbose('[', me.options.verbose);
        return mail.users.messages.list(_.clone(mailArgs)).then(pager);
    }

    handleMessage(auth, msg, callback) {
        var me = this;
        me.getMessage(auth, msg)
            .then(function(response) {
                var msgDate = Moment(response.internalDate, 'x').tz('Europe/Zurich');
                var subject = _.find(response.payload.headers, function(header) {
                    return header.name === 'Subject';
                }).value;
                if (subject.length > 80) {
                    subject = subject.substring(0,50).trim() + '...';
                }

                var from = _.find(response.payload.headers, function(header) {
                    return header.name === 'From';
                }).value;

                var displayName = from.match(/(.*) <(.*@.*)>/);
                if (displayName) {
                    from = displayName[1];
                }

                var msg = {
                    'project': 'xxx',
                    'time': '1',
                    'text': subject + ' (' + from + ', ' + msgDate.format('HH:mm') + ')',
                    'timestamp': msgDate.startOf('day').format('X'),
                    'type': 'mail',
                    'comment': false
                };
                callback(null, msg);
            })
            .catch(function(err) {
                callback(err);
            });
    }

    getMailConfig(config) {
        var template = {
            'include': [],
            'exclude': [],
            'query': ''
        };
        var fromFile = config.mail || {};
        var mailConfig = _.assignIn(template, fromFile);

        if (! _.isArray(mailConfig.include) || ! _.isArray(mailConfig.exclude) || ! _.isString(mailConfig.query)) {
            throw new Error("YAML config of mail is malformated (include/exclude must be a list, query must be a string)");
        }

        return mailConfig;
    }

    getMessage(auth, msg) {
        var me = this;
        var cacheResult = me.options.cache.getSync('gmail-msg-' + msg.id);
        if (cacheResult) {
            helper.printVerbose('c', me.options.verbose);
            return Promise.resolve(cacheResult);
        }
        const mail = google.gmail({
            version: 'v1',
            auth: auth
        });

        var mailOpts = {
            auth: auth,
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject']
        };
        return mail.users.messages.get(mailOpts)
            .then(function(response) {
                me.options.cache.putSync('gmail-msg-' + msg.id, response.data);
                return response.data;
            });
    }
}

module.exports = GoogleMail;
