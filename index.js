"use strict";
exports.__esModule = true;
var fs = require("fs");
var childProc = require("child_process");
var chokidar = require("chokidar");
var greenBG = "\x1b[42m";
var redBG = "\x1b[41m";
var resetBG = "\x1b[0m";
var liveServer = require('live-server');
var config = JSON.parse(fs.readFileSync('./hx-liveify.json', 'utf8'));
var procPool = new Array();
var handleExit = (function () {
    var exitCallback = function () {
        procPool.map(function (cp) {
            cp.kill('SIGINT');
            cp.stdin.end();
            cp.stdout.destroy();
            cp.stderr.destroy();
            console.log("Haxe-Liveify has exited.");
        });
    };
    process.on('exit', function () {
        exitCallback();
    });
    process.on('SIGINT', function () {
        console.log('Ctrl-C...');
        process.exit(2);
    });
    process.on('uncaughtException', function (e) {
        console.log('Uncaught Exception...');
        console.log(e.stack);
        process.exit(99);
    });
})();
var liveReload = (function () {
    var params = {
        port: 4000,
        host: "0.0.0.0",
        root: config.out,
        logLevel: 0
    };
    liveServer.start(params);
    console.log("Listening on http://" + params.host + ":" + params.port + "/");
})();
var liveify = (function () {
    var cp;
    chokidar.watch(config.src, { ignored: /(^|[\/\\])\../ }).on('all', function (event, path) {
        if (event == 'change') {
            console.log(greenBG + "Building..." + resetBG);
            // Kill build processs if change is made.
            if (cp != null) {
                cp.kill('SIGINT');
                cp.stdin.end();
                cp.stdout.destroy();
                cp.stderr.destroy();
            }
            // Run different build commands depending on compiler (haxe, openfl, lime).
            if (config.compiler === "haxe") {
                cp = childProc.spawn('haxe', [config.hxml]);
                procPool.push(cp);
            }
            else {
                cp = childProc.spawn('haxelib', ['run', config.compiler, 'build'].concat(config.platforms));
                procPool.push(cp);
            }
            // Print stdout to console.
            cp.stdout.on('data', function (data) {
                if (typeof data === "string")
                    console.log("" + greenBG + data);
                else
                    console.log("" + greenBG + data.toString());
            });
            cp.stderr.on('data', function (data) {
                if (typeof data === "string")
                    console.log("" + redBG + data);
                else
                    console.log("" + redBG + data.toString());
            });
            cp.on('exit', function (code) {
                console.log(greenBG + "Process complete and exited with code: " + code + resetBG);
            });
        }
    });
})();
exports["default"] = liveify;
