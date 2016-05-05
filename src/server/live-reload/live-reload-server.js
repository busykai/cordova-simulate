// Copyright (c) Microsoft Corporation. All rights reserved.

var fs = require('fs');
var path = require('path');
var telemetry = require('../telemetry-helper');
var Watcher = require('./watcher').Watcher;

var socket;
var watcher;

function cssFileChanged(fileRelativePath) {
    telemetry.sendTelemetry('live-reload', { fileType: '.css' });
    socket.emit('lr-update-css', { href: fileRelativePath.replace(/\\/g, '/') });
}

function nonCssFileChanged(fileRelativePath) {
    telemetry.sendTelemetry('live-reload', { fileType: path.extname(fileRelativePath) });
    socket.emit('lr-full-reload');
}

module.exports.init = function (sock) {
    if (!watcher) {
        watcher = new Watcher(cssFileChanged, nonCssFileChanged);
        watcher.startWatching();
    }

    socket = sock;
    socket.emit('start-live-reload');
};
module.exports.stop = function () {
    if (watcher) {
        watcher.stopWatching();
    }
}