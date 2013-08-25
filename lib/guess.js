var os = require('os');

module.exports = function guess() {
    var info = {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch()
    };

    if (info.platform === 'darwin') {
        info.attach = '/Volumes/SANSA CLIP/';
        info.folder = '/Volumes/SANSA CLIP/RECORD/VOICE/';
        return info;
    }

    if (info.platform === 'linux' && info.arch === 'arm') {
        // assume raspberry pi
        info.attach = '/media/usb0/';
        info.folder = '/media/usb0/RECORD/VOICE/';
        return info;
    }

}