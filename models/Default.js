Backbone.io.connect();

Backbone.Collection.prototype.move = function (from, to) {
    console.log ('moving', from, to, this);
    if (! this.models[from] || ! this.models[to])
        return;

    var model = this.models[from].set_index(to, {silent: true});

    if (from < to) {
        for (var i = from; i < to; i++) {
            this.models[i] = this.models[i+1];
            this.models[i].set_index(i, {silent: true});
        }
    } else {
        for (var i = from; i > to; i--) {
            this.models[i] = this.models[i-1];
            this.models[i].set_index(i, {silent: true});
        }
    }

    this.models[to] = model;
    this.trigger('change:reorder');
    return model;
};
Backbone.View.prototype.moveDOM = function (id, from, to) {
    var jumper = $('#' + id) || console.trace ('ho noes');
    var dest = $('#' +this.collection.models[to].get_id());
    if (from < to) {
        jumper.insertAfter(dest);
    } else {
        jumper.insertBefore(dest);
    }
    return dest;
};

Backbone.PageableCollection.prototype.setQuery = function (query, page_size) {
    var state = this.state;
    if(query != state.query) {
        state = _.clone(this._initState)
        state.pageSize = page_size || state.pageSize;
    }
    state = this.state = this._checkState(_.extend({}, state, {
        query: query,
    }));
};

_.mixin({
    pluck: function(obj, key) {
        if (key.indexOf(".") === -1) {
            return _.map(obj, function(value){ return value[key]; });
        }
        var keys = key.split(".").reverse();
        while(keys.length) {
            obj = _.pluck(obj, keys[keys.length - 1]);
            keys.pop();
        }
        return obj;
    }
});
