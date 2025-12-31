const { exec } = require('child_process');
const next = require('next');
const http = require('http');
const open = require('open');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();
// Port is set to 0 to let the OS assign any available port
const port = 0; 

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve();
    });

    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}

async function main() {
  try {
    console.log('Building the Next.js application for production...');
    await runCommand('npm run build');
    console.log('Build complete.');

    await app.prepare();
    
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    server.listen(port, (err) => {
      if (err) throw err;
      const actualPort = server.address().port;
      const url = `http://localhost:${actualPort}`;
      console.log(`> Ready on ${url}`);
      console.log('Opening the application in your default browser...');
      open(url);
    });
  } catch (err) {
    console.error('Failed to start the offline server:', err);
    process.exit(1);
  }
}

main();
