var LiferecorderSync = require('..'),
	os = require('os'),
	levelup = require('level'),
	db = levelup(os.tmpDir() + '/dbfolder', {
		valueEncoding: 'json'
	}),
	test_files = os.tmpDir() + '/mediafolder',

	sync = new LiferecorderSync(db, test_files, false)
		.on('attached', function(){
			console.log('Attached');
		})
		.on('process', function(count, total) {
			console.log('process ', count, '/', total);
		})
		.on('sync-complete', function(){
			console.log('sync-complete');
			db.createReadStream()
				.on('data', function(data){
					console.log(data.key, data.value);
				})
		})
		.on('detached', function(){
			console.log('detached');
		});