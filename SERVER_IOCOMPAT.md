mbc-serverio: bindBackend() on the server and sync with Redis.
==============================================================

This lets you use models from the server and keeping them in sync
with other servers and web browsers without changes.

Just call .pathcBackbone() on your iobackends instance before importing
your models. It will take care of the rest.

On the browser your models will use the bindBackend provided by backbone.io.
On the server they use our version that not only syncs to the backends but
also with the browser and other node processes via redis.

Syncing via redis is optional and can be enabled with something like this
on your backend definition:

```javascript
    list: {
        use: [middleware.uuid],
        redis: {
            chain: false,
        },
        mongo: {
            db: db,
            collection: collections.Lists,
            opts: { search: search_options.Lists },
        }},
```

* redis:    if true we broadcast our changes to other servers and also when
            we get an update it is passed to the browser and our models.

            Default value: false.

* chain:    if true the processing does not stop at the redis middleware and
            goes on to the rest of the chain. This is only needed when using
            something like memoryStore() because doing a 'read' in that case
            will not return the most recent data. When using mongo (or another
            permanent storage) the other end already saved there and so if we
            do a 'read' we will get the correct result.

            Default value: false.


How it works:
-------------

Magic.

We have two middlewares, eventMiddleware and redisMiddleware.

The event middleware when a request other than 'read' from the browser arrives
emits a custom event from the backend. On the server the models listen to that
and update themselves.

The redis middleware on one hand listens for changes and fakes a request to the
backend so other clients(browsers) are notified and also emits another custom
event so the models on the server are updated. On the other when we get a
change either from the browser or a model on the server it broadcasts it over
redis.

The call to patchBackbone() on an iobackends instance modifies Backbone.Model
and Backbone.Collection so when (if) they call bindBackend() they listen for
the messages emmited by the middlewares and also if something changes on the
server they fake a request to the underlying backend so they are sent to the
browser and other servers if syncing over redis is enabled.
