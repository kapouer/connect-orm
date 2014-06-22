connect-orm
===========

orm session store for Connect

Usage
-----

```
var orm = require('orm');
var session = require('express-session');
var OrmStore = require('connect-orm')(session);

// connect to orm db somewhere in the app
var db = orm.connect("mysql://root:password@localhost/test");

app.use(session({
  store: new OrmStore(db, {
    table: 'sessions',                // collection name
    maxAge: 1000 * 60 * 60 * 24 * 14  // default duration in milliseconds
  })
}));

```

Note that maxAge can also be set in session.cookie.maxAge, see
https://github.com/expressjs/session

Features
--------

Automatic cleanup of expired sessions
Compatible with express 3 (version 0.1):
```
var OrmStore = require('connect-orm')(express);
```

