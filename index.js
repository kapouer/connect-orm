/*!
 * connect-orm
 * Copyright 2013 Jérémy Lal <kapouer@melix.org>
 * MIT Licensed, see LICENSE file
 */

/**
 * Default options
 */

var defaults = {
	table: 'sessions',
	maxAge: 1000 * 60 * 60 * 24 * 14 // even session cookies should be destroyed, eventually
};

function noop() {}

module.exports = function(connect) {
	"use strict";
	var ConnectStore = connect.session.Store;

	/**
	 * Initialize Store with the given `options`.
	 * 
	 * @param {ORM} db
	 * @param {Object} options
	 * @api public
	 */

	function Store(db, options) {
		options = options || {};
		ConnectStore.call(this, options);
		this.maxAge = options.maxAge || defaults.maxAge;
		var Session = this.Session = db.define('Session', {
			sid: {
				type: 'text',
				unique: true
			},
			expires: {
				type: 'date',
				index: true
			},
			session: Object
		}, {
			table: options.table || defaults.table
		});
		Session.sync(); // TODO callback
		
		// destroy all expired sessions after each create/update
		Session.afterSave = function(next) {
			Session.find({ expires: db.lte(new Date()) }).remove(next);
		};
	}

	/**
	 * Inherit from `Store`.
	 */

	require('util').inherits(Store, ConnectStore);

	/**
	 * Attempt to fetch session by the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Function} callback
	 * @api public
	 */
	
	Store.prototype.get = function(sid, callback) {
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

	Store.prototype.set = function(sid, session, callback) {
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

	Store.prototype.destroy = function(sid, callback) {
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

	Store.prototype.length = function(callback) {
		this.Session.count(callback);
	};

	/**
	 * Clear all sessions.
	 *
	 * @param {Function} callback
	 * @api public
	 */

	Store.prototype.clear = function(callback) {
		this.Session.all().remove(callback);
	};
	
	return Store;
};
