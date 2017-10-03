"use strict";
exports.__esModule = true;
var fs = require("fs");
var process = require("child_process");
var chokidar = require("chokidar");
var liveServer = require('live-server');
var config = JSON.parse(fs.readFileSync('./hx-liveify.json', 'utf8'));
var cp;
var liveReload = (function () {
    var params = {
        port: 4000,
        host: "0.0.0.0",
        root: config.out
    };
    liveServer.start(params);
})();
var liveify = chokidar.watch(config.src, { ignored: /(^|[\/\\])\../ }).on('all', function (event, path) {
    if (event == 'change') {
        // Kill build processs if change is made.
        if (cp != null) {
            cp.kill('SIGINT');
            cp.stdin.end();
            cp.stdout.destroy();
            cp.stderr.destroy();
        }
        // Run different build commands depending on compiler (haxe, openfl, lime).
        if (config.compiler == "haxe") {
            cp = process.spawn('haxe', [config.hxml]);
        }
        else {
            cp = process.spawn('haxelib', ['run', config.compiler, 'build'].concat(config.platforms));
        }
        // Print stdout to console.
        cp.stdout.on('data', function (data) {
            if (typeof data === "string")
                console.log(data);
        });
        cp.stderr.on('data', function (data) {
            if (typeof data === "string")
                console.log(data);
        });
        cp.on('exit', function (code) {
            console.log("Child process exited with code: " + code);
        });
    }
});
exports["default"] = liveify;
