connect-orm
===========

orm session store for Connect

Usage
-----

```
var orm = require('orm');
var Store = require('connect-orm');

// connect to orm db somewhere in the app
var db = orm.connect("mysql://root:password@localhost/test");

app.use(express.session({
  store: new Store(db, {
    table: 'sessions',                // collection name
    maxAge: 1000 * 60 * 60 * 24 * 14  // default duration in milliseconds
  })
}));

```

Note that maxAge can also be set in session.cookie.maxAge, see
http://www.senchalabs.org/connect/session.html

Features
--------

Automatic cleanup of expired sessions

