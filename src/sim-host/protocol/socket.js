// Copyright (c) Microsoft Corporation. All rights reserved.

var telemetry = require('telemetry-helper');

var socket;

module.exports.initialize = function (pluginHandlers, serviceToPluginMap) {
    socket = io();
    module.exports.socket = socket;

    socket.on('init-telemetry', function (data) {
        telemetry.init(socket);
    });
    socket.on('exec', function (data) {
        if (!data) {
            throw 'Exec called on simulation host without exec info';
        }

        var index = data.index;
        if (typeof index !== 'number') {
            throw 'Exec called on simulation host without an index specified';
        }

        var success = data.hasSuccess ? getSuccess(index) : null;
        var failure = data.hasFail ? getFailure(index) : null;

        var service = data.service;
        if (!service) {
            throw 'Exec called on simulation host without a service specified';
        }

        var action = data.action;
        if (!action) {
            throw 'Exec called on simulation host without an action specified';
        }

        console.log('Exec ' + service + '.' + action + ' (index: ' + index + ')');

        var handler = pluginHandlers[service] && pluginHandlers[service][action];
        var telemetryProps = { plugin: serviceToPluginMap && serviceToPluginMap[service], service: service, action: action };
        if (!handler) {
            telemetryProps.handled = 'none';
            handler = pluginHandlers['*']['*'];
            handler(success, failure, service, action, data.args);
        } else {
            telemetryProps.handled = 'sim-host';
            handler(success, failure, data.args);
        }

        telemetry.sendClientTelemetry('exec', telemetryProps);
    });
    socket.on('refresh', function () {
        document.location.reload(true);
    });
};

module.exports.notifyPluginsReady = function () {
    socket.emit('register-simulation-host');
}

function getSuccess(index) {
    return function (result) {
        console.log('Success callback for index: ' + index + '; result: ' + result);
        var data = { index: index, result: result };
        socket.emit('exec-success', data);
    };
}

function getFailure(index) {
    return function (error) {
        console.log('Failure callback for index: ' + index + '; error: ' + error);
        var data = { index: index, error: error };
        socket.emit('exec-failure', data);
    };
}
