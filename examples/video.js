#!/usr/bin/env node
var async     = require('async');
var crypto    = require('crypto');
var exec      = require('child_process').exec;
var fs        = require('fs');
var himawari  = require('../index');
var path      = require('path');

// Image Output Directory
var out = path.join('/tmp', 'video-out');
var video = path.join('/tmp/demo', 'himawari-8_earth.mp4');

// init vars
var videoWidth = 920;
var yesterday = (function(d){d.setDate(d.getDate()-1);d.setHours(15,0,0,0);return d})(new Date);
var info = 'Himawari-8 ' + yesterday.toDateString();
var infoX = videoWidth - 215 - 15;

// 24 Hours in a day, 60 minutes per hour, divided by time resolution
var resolution = 10;
var intervals = (24 * 60) / resolution;

// Counts and a list
var minutes = 0;
var dates = [];

// Create a list of dates starting from `start` and decrement each `interval` by the `resolution`
for (var i = 0; i < intervals; i++) {
    var date = new Date(yesterday);
    date.setMinutes(minutes);
    dates.push(date);
    minutes -= resolution;
}

var interval = 1;

// Create our out folder
if (!fs.existsSync(out)) fs.mkdirSync(out);

// Request an image from each date
async.eachSeries(dates, function (date, cb) {
    console.log('Time Interval', interval+'/'+dates.length);
    interval++;

    var outfile = path.join(out, 'earth-' + date.getTime() + '.jpg');

    if (fs.existsSync(outfile)) {
        console.log(outfile + ' exists, skipping');
        return cb();
    }

    // Download from himawari api
    himawari({
        outfile: outfile,
        zoom: 1,
        date: date,
        chunk: function (info) {
            console.log('  Part ' + info.part + '/' + info.total);
        },
        success: function () { return cb(); },
        error: function (err) { return cb(err); }
    });
}, function (err, res) {

    // Pipe all images to ffmpeg and create a video. Simple as that!
    exec('cat ' + path.join(out, '*.jpg') + ' | ffmpeg -f image2pipe -vcodec mjpeg -analyzeduration 100M -probesize 100M -i - -vcodec libx264 -vf scale=' + videoWidth + ':-1,drawtext=fontfile=Verdana.ttf:fontsize=16:fontcolor=white:x=' + infoX + ':y=27:box=1:boxcolor=red@0.2:text="' + info + '" -y ' + video, function (err, res) {
        if (err) {
            console.error(err);
        } else {
            console.log('File saved to', video);
        }
    });

});