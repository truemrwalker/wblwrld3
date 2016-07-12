const http = require('http');
const exec = require('child_process').exec;

http.createServer(function (req, res) {

	console.log("Deploying Webble World Platform...");

    const deployment = exec('./deploy.sh')

    deployment.on('exit', (deploymentCode) => {

        console.log("Result:", deploymentCode);

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('OK');
    });

}).listen(9616, '127.0.0.1');
