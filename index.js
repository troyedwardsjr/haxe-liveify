"use strict";
exports.__esModule = true;
var process = require("child_process");
var chokidar = require("chokidar");
var cp;
var liveify = chokidar.watch('Source', { ignored: /(^|[\/\\])\../ }).on('all', function (event, path) {
    if (event == 'change') {
        console.log(event, path);
        if (cp != null) {
            cp.kill('SIGINT');
            cp.stdin.end();
            cp.stdout.destroy();
            cp.stderr.destroy();
        }
        cp = process.spawn('haxelib', ['run', 'openfl', 'build', 'html5', '-debug']);
        cp.stdout.on('data', function (data) {
            console.log("" + data);
        });
        cp.stderr.on('data', function (data) {
            console.log("" + data);
        });
        cp.on('close', function (code) {
            console.log("Child process closed with code: " + code);
        });
        cp.on('exit', function (code) {
            console.log("Child process exited with code: " + code);
        });
    }
});
exports["default"] = liveify;
