import * as fs from 'fs';
import * as process from 'child_process';
import * as chokidar from 'chokidar';
const liveServer = require('live-server');

interface Config {
  compiler: string;
  src: string;
  out: string;
  hxml: string;
  platforms: Array<string>;
}

const greenBG : string = "\x1b[42m";
const redBG : string = "\x1b[41m";
let config : Config = JSON.parse(fs.readFileSync('./hx-liveify.json', 'utf8'));
let cp : process.ChildProcess;

const liveReload = (() => {
  const params = {
    port: 4000, 
    host: "0.0.0.0",
    root: config.out
  };
  liveServer.start(params);
})()

const liveify : chokidar.FSWatcher = chokidar.watch(config.src, {ignored: /(^|[\/\\])\../}).on('all', (event:string, path:string) => {
  if(event == 'change') {
    console.log(`${greenBG}Building... \n`);

    // Kill build processs if change is made.
    if(cp != null) {
      cp.kill('SIGINT');
      cp.stdin.end();
      cp.stdout.destroy();
      cp.stderr.destroy();
    }

    // Run different build commands depending on compiler (haxe, openfl, lime).
    if(config.compiler == "haxe") {
      cp = process.spawn('haxe', [config.hxml]);
    } else {
      cp = process.spawn('haxelib', ['run', config.compiler, 'build'].concat(config.platforms));
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
      console.log(`${greenBG}Process complete and exited with code: ${code} \n`);
    });
  }
});

export default liveify;