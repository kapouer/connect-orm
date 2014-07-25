/*!
 * connect-orm
 * Copyright 2013-2014 Jérémy Lal <kapouer@melix.org>
 * MIT Licensed, see LICENSE file
 */

var orm = require('orm');

/**
 * Default options
 */

var defaults = {
	table: 'sessions',
	maxAge: 1000 * 60 * 60 * 24 * 14 // even session cookies should be destroyed, eventually
};

function noop() {}

module.exports = function(session) {
	"use strict";
	var Store = session.Store || session.session && session.session.Store;

	/**
	 * Initialize OrmStore with the given `options`.
	 *
	 * @param {ORM} db
	 * @param {Object} options
	 * @api public
	 */

	function OrmStore(db, options) {
		options = options || {};
		Store.call(this, options);
		this.maxAge = options.maxAge || defaults.maxAge;
		var Session = this.Session = db.define('Session', {
			sid: {
				type: 'text',
				unique: true
			},
			expires: {
				type: 'date',
				time: true,
				index: true
			},
			session: Object
		}, {
			table: options.table || defaults.table,
			hooks: {
				afterSave: function(success) {
					Session.find({ expires: orm.lte(new Date()) }).remove(function(err) {
						if (err) console.error(err);
					});
				}
			}
		});
		Session.sync(); // TODO callback
	}

	/**
	 * Inherit from `Store`.
	 */

	require('util').inherits(OrmStore, Store);

	/**
	 * Attempt to fetch session by the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Function} callback
	 * @api public
	 */

	OrmStore.prototype.get = function(sid, callback) {
		callback = callback || noop;
		this.Session.one({sid: sid}, function(err, session) {
			if (err) return callback(err);
			if (!session) return callback();
			if (!session.expires || new Date() < session.expires) {
				callback(null, session.session);
			} else {
				session.remove(callback);
			}
		});
	};

	/**
	 * Commit the given `session` object associated with the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Session} session
	 * @param {Function} callback
	 * @api public
	 */

	OrmStore.prototype.set = function(sid, session, callback) {
		callback = callback || noop;
		var s = {
			session: session
		};
		if (session && session.cookie && session.cookie.expires) {
			s.expires = new Date(session.cookie.expires);
		} else {
			s.expires = new Date(Date.now() + this.maxAge);
		}
		var Session = this.Session;
		Session.one({sid: sid}, function(err, session) {
			if (err) return callback(err);
			if (session) {
				session.save(s, function(err) {
					callback(err);
				});
			} else {
				s.sid = sid;
				Session.create(s, function(err) {
					callback(err);
				});
			}
		});
	};

	/**
	 * Destroy the session associated with the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Function} callback
	 * @api public
	 */

	OrmStore.prototype.destroy = function(sid, callback) {
		callback = callback || noop;
		this.Session.one({sid: sid}, function(err, session) {
			if (err) return callback(err);
			if (!session) return callback();
			session.remove(callback);
		});
	};

	/**
	 * Fetch number of sessions.
	 *
	 * @param {Function} callback
	 * @api public
	 */

	OrmStore.prototype.length = function(callback) {
		this.Session.count(callback);
	};

	/**
	 * Clear all sessions.
	 *
	 * @param {Function} callback
	 * @api public
	 */

	OrmStore.prototype.clear = function(callback) {
		this.Session.all().remove(callback);
	};

	return OrmStore;
};
