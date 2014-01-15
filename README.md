mbc-common. *Experimental* Sync across servers via Redis.
=========================================================

Just a demo, using models from the server and keeping them in sync
with other servers and web browsers.

bindBackend() now works on the server, and keeps in sync with the
changes on browsers (both ways). You need to call .patchBackbone()
on your iobackends instance before.

Also, we can sync with other instances using Redis with something
like this on the backend definition:

```javascript
    list: {
        use: [middleware.uuid],
        redisSync:  true,
        redisChain: false,
        mongo: {
            db: db,
            collection: collections.Lists,
            opts: { search: search_options.Lists },
        }},
```

* redisSync: if true we broadcast our changes to other servers and also when
            we get an update it is passed to the browser and our models.

* redisChain: if true the processing does not stop at the redis middleware and
            goes on to the rest of the chain. This is only needed when using
            something like memoryStore() because doing a 'read' in that case
            will not return the most recent data. When using mongo (or another
            permanent storage) the other end already saved there and so if we
            do a 'read' we will get the correct result.

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

### 0.0.1

* database connection
* JSONredis object
* refactor db
* rename JSONredis to pubsub
* add caspa config
* add mosto config
* change default pubsub client to redis

