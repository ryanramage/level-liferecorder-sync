module.exports = Watch;

var util = require('util'),
    events = require('events'),
    mkdirp = require('mkdirp'),
    Upload = require('./lib/upload'),
    watchFolder = require('./lib/watch-folder'),
    guess = require('./lib/guess')();


function Watch(db, media_folder, deleteOnSuccess, options) {
    var me = this;

    if (!options) options = guess;
    if (!options.attach) options.attach = guess.attach;
    if (!options.folder) options.folder = guess.folder;
    
    mkdirp.sync(media_folder);

    watchFolder.start(options.attach);

    watchFolder.on('attached', function(f) {
        me.emit('attached', f);
        new Upload(options.folder, db, media_folder, deleteOnSuccess, function(err){
            if (err) return console.log('error: ', err);
            me.emit('sync-complete');
        }).on('process', function(count, total){
            me.emit('process', count, total);
        });
    });

    watchFolder.on('detached', function(){
        me.emit('detached');
    });
    
}

util.inherits(Watch, events.EventEmitter);

