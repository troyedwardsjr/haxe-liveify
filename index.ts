import * as fs from 'fs';
import * as process from 'child_process'
import chokidar = require('chokidar');

let cp : process.ChildProcess;

const liveify = chokidar.watch('Source', {ignored: /(^|[\/\\])\../}).on('all', (event:string, path:string) => {
  if(event == 'change') {
    console.log(event, path);
    if(cp != null) {
      cp.kill('SIGINT');
      cp.stdin.end();
      cp.stdout.destroy();
      cp.stderr.destroy();
    }
    cp = process.spawn('haxelib', ['run', 'openfl', 'build', 'html5', '-debug']);
    cp.stdout.on('data', (data: string | Buffer) => {
      console.log(data);
    });
    cp.stderr.on('data', (data: string | Buffer) => {
      console.log(data);
    });
    cp.on('close', (code: number) => {
      console.log(`Child process closed with code: ${code}`);
    });
    cp.on('exit', (code: number) => {
      console.log(`Child process exited with code: ${code}`);
    });
  }
});

export default liveify;