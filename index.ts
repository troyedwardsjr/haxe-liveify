import * as fs from 'fs';
import * as childProc from 'child_process';
import * as chokidar from 'chokidar';
import { ChildProcess } from 'child_process';

interface Config {
  compiler: string;
  src: string;
  out: string;
  hxml: string;
  platforms: Array<string>;
}

const greenBG : string = "\x1b[42m";
const redBG : string = "\x1b[41m";
const resetBG : string = "\x1b[0m";
const liveServer : any = require('live-server');
const config : Config = JSON.parse(fs.readFileSync('./hx-liveify.json', 'utf8'));

let procPool : Array<ChildProcess>  = new Array<ChildProcess>();

const handleExit : void = (() => {
  const exitCallback : Function = () => {
    procPool.map((cp:ChildProcess) => {
      cp.kill('SIGINT');
      cp.stdin.end();
      cp.stdout.destroy();
      cp.stderr.destroy();
      console.log("Haxe-Liveify has exited.");
    });
  }
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

const liveReload : void = (() => {
  const params = {
    port: 4000, 
    host: "0.0.0.0",
    root: config.out,
    logLevel: 0
  };
  liveServer.start(params);
})();

const liveify : void = (() => {
  let cp : ChildProcess;
  chokidar.watch(config.src, {ignored: /(^|[\/\\])\../}).on('all', (event:string, path:string) => {
    if(event == 'change') {
      console.log(`${greenBG}Building...${resetBG}`);
      // Kill build processs if change is made.
      if(cp != null) {
        cp.kill('SIGINT');
        cp.stdin.end();
        cp.stdout.destroy();
        cp.stderr.destroy();
      }
      // Run different build commands depending on compiler (haxe, openfl, lime).
      if(config.compiler === "haxe") {
        cp = childProc.spawn('haxe', [config.hxml]);
        procPool.push(cp);
      } else {
        cp = childProc.spawn('haxelib', ['run', config.compiler, 'build'].concat(config.platforms));
        procPool.push(cp);
      }
      // Print stdout to console.
      cp.stdout.on('data', (data: string | Buffer) => {
        if(typeof data === "string") 
          console.log(`${greenBG}${data}`);
        else 
          console.log(`${greenBG}${data.toString()}`);
      });
      cp.stderr.on('data', (data: string | Buffer) => {
        if(typeof data === "string") 
          console.log(`${redBG}${data}`);
        else 
          console.log(`${redBG}${data.toString()}`);
      });
      cp.on('exit', (code: number) => {
        console.log(`${greenBG}Process complete and exited with code: ${code}${resetBG}`);
      });
    }
  });
})();

export default liveify;