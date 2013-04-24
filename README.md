mbc-common
==========

Common code for mbc-playout and mbc-mosto

REQUIREMENTS
============

* Redis (`$ apt-get install redis-server )

Versioning
----------

major.minor.patch

* major: backwards-incompatible changes
* minor: new features
* patch: bugfix

CHANGELOG
=========

- 0.0.1: database connection
- 0.1.0: JSONredis object
- 0.1.1: refactor db
- 1.0.0: rename JSONredis to pubsub
- 1.1.0: add caspa config
- 1.1.1: add mosto config
- 2.0.0: change default pubsub client to redis
