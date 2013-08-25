Level Liferecorder sync
=======================

Syncs a liferecorder like (http://eckoit.com and others) to a leveldb instance, and copies the media files to a chosen dir. It watches the expected attachment directory on the choosen platform.

Usage
-----

```
var LiferecorderSync = require('level-liferecorder-sync'),
	test_files = os.tmpDir() + '/mediafolder',
	db = levelup(os.tmpDir() + '/dbfolder', {
		valueEncoding: 'json'
	}),
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
``` 

Which would store the json into the leveldb, and output something like:

```
1377379776000 { hash: '2f01581e2ba8673ffb6aee937fe61830',
  file: '1377450973314/R_MIC_130824-152936.mp3',
  liferecorder: true,
  start: 1377379776000,
  end: 1377379776600.0798 }
1377395669000 { hash: 'e061eea1140103eeb6072a00d25d876f',
  file: '1377450973314/R_MIC_130824-195429.mp3',
  liferecorder: true,
  start: 1377395669000,
  end: 1377395669003.866 }
1377404955000 { hash: '6296556fbc204ad21040c521a4870370',
  file: '1377450973314/R_MIC_130824-222915.mp3',
  liferecorder: true,
  start: 1377404955000,
  end: 1377404955012.277 }
1377405508000 { hash: '5c30b69a55e416201753f36b7137ed19',
  file: '1377450973314/R_MIC_130824-223828.mp3',
  liferecorder: true,
  start: 1377405508000,
  end: 1377405508007.1572 }
1377445242000 { hash: '2e981a195953a1b0e318199c7ff16553',
  file: '1377450973314/R_MIC_130825-094042.mp3',
  liferecorder: true,
  start: 1377445242000,
  end: 1377445242013.2434 }
```

Where the files will been copied to the media directory:

os.tmpDir() + '/mediafolder/1377450973314/R_MIC_130825-094042.mp3' 

