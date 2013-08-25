module.exports = Upload;

var path = require('path'),
    crypto = require('crypto'),
    util = require('util'),
    events = require('events'),
    fs = require('fs'),
    async = require('async'),
    probe = require('node-ffprobe'),
    _ = require('underscore'),
    moment = require('moment'),
    cp = require('cp'),
    sansa = require('./sansa_clip_recorder');

util.inherits(Upload, events.EventEmitter);

function Upload(source_dir, db, root_dest_dir, /* optional */ deleteOnSuccess, callback) {
    var me = this;

    if (_.isFunction(deleteOnSuccess)) {
        callback = deleteOnSuccess;
        deleteOnSuccess = false;
    }

    fs.readdir(source_dir, function(err, files) {
        if (err) return callback(err);
	    if (!files || !files.length) return callback(null);

        var files2 = _.map(files, function(file){
                return path.join(source_dir, file);
            }), 
            counter = 0,
            notify = function() {
                counter++;
                me.emit('process', counter, files.length);
            }


        create_dest_dir(root_dest_dir, function(err, dest_dir, ts_folder){
            if (err) return callback(err);
            async.mapLimit(files2, 2, function(file, cb){
                processFile(file, dest_dir, ts_folder, notify, cb);
            }, function(err, results){

                var recordings = _.groupBy(results, function(recording){
                    if(recording.getError()) return 'error';
                    else return 'ok';
                });

                findMarks(recordings.ok, function(err, marks) {
                    finish_upload(db, {recordings: recordings, marks: marks}, function(err2, upload_errors){
                    if (deleteOnSuccess) deleteFiles(recordings, upload_errors, callback);
                        else callback();
                    });
                });



            });
        });

    });
}


function processFile(file, dest_dir, ts_folder, notify, callback) {

    var filename = path.basename(file),
        start_date = findAudioDate(filename, file.lastModifiedDate),
        new_file = path.join(dest_dir, filename);

    cp(file, new_file, function(err){
        if (err) return callback(err);
        probe(new_file, function(err, probeData) {

            if (err) {
                probeData = {
                    error: err
                };
            } else {
                probeData.duration = probeData.format.duration;
            }

            probeData.name = [ts_folder, filename].join('/');
            probeData.old_file = file;
            probeData.file = new_file;
            probeData.start_date = start_date;

            probeData.durationMS = function() {
                return (this.duration * 1000);
            };
            probeData.getEndMoment = function() {
                return this.start_date +  (this.duration * 1000);
            };

            probeData.getError = function() {
                if (probeData.error) return probeData.error;
                return false;
            };

            hash_file(probeData.file, function(hash){
                probeData.hash = hash;
                notify();
                callback(null, probeData);
            });
            
        });
    });
}


function create_dest_dir(root_dest_dir, cb) {
    // always the hash of the first recording in the set
    var ts = new Date().getTime() + '';
    var dest_dir = path.join(root_dest_dir, ts);

    console.log('moving files to: ', dest_dir);    
    fs.mkdir(dest_dir, function(err){
        cb(err, dest_dir, ts);
    });
}


function finish_upload(db, details, callback) {
    async.parallel([
        function(cb) { upload_audio(db, details, cb); },
        function(cb) { upload_marks(db, details, cb) ; }

    ], callback);

}


function upload_audio(db, details, callback) {

    async.eachLimit(details.recordings.ok, 2, function(recording, cb) {

        var doc = {
            hash : recording.hash,
            file: recording.name,
            liferecorder: true,
            start: recording.start_date,
            end: recording.start_date + recording.duration
        };
        db.put(doc.start, doc, cb);
    }, callback);
}

function upload_marks(couch_url, details, callback) {
    callback(null);
}

function convert(marks) {
    return _.map(marks, function(mark){
        return {
            type: 'memoir.tag',
            timestamp: mark,
            length: 30000
        };
    })
}


function findMarks(recordings, callback) {
    var marks = sansa.findMarks(recordings);
    callback(null, marks);
}




function deleteFiles(recordings, upload_errors, callback) {
    //move errors into error folder

    //remove rest
    async.eachLimit(recordings.ok, 2, function(recording, cb){
        console.log('removing file', recording.file);
        fs.unlink(recording.file, function(err){
            if (err) console.log(err);
            cb();
        });
    }, callback);

}


function hash_file(file, callback) {
    var shasum = crypto.createHash('md5');
    var s = fs.ReadStream(file);

    s.on('data', function(d) {
      shasum.update(d);
    });

    s.on('end', function() {
      var d = shasum.digest('hex');
      callback(d);
    });
}







function findAudioDate(str, modifiedDate) {
    str = str.replace('R_MIC_', '');
    str = str.replace('.mp3', '');
    var m =  moment(str, "YYMMDD-HHmmss");
    return m.valueOf();
}
