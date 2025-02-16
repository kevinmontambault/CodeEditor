const os = require('os');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const compression = require('compression');
const QRCode = require('qrcode');
const Auth = require('./src/Auth.js');

const config = require(path.join(__dirname, 'config.json'));

const app = express();
app.use(express.json());
app.use(compression());

// Middleware to verify the client certificate
app.use((req, res, next) => {
    const cert = req.socket.getPeerCertificate();
    if(req.client.authorized && cert.subject){ return next(); }

    res.status(401).send('Client certificate required');
    res.end();
});

app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/img', express.static(path.join(__dirname, 'www/img')));
app.use('/www', express.static(path.join(__dirname, 'www')));

app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, 'manifest.json')));

// main editor entry point
app.get('/editor', (req, res) => res.sendFile(path.join(__dirname, 'www/editor.html')));

// get a mounted directory
app.get('/drive*', /*Auth.validate, */async (req, res) => {
    const rootPath = path.normalize(config.root);
    const fullPath = path.normalize(path.join(rootPath, decodeURIComponent(req.url.slice(6))));
    
    if(!fullPath.startsWith(rootPath)){ return res.status(403).end(); }

    // check if the file is a directory
    let fileStat;
    try{ fileStat = await fs.stat(fullPath); }
    catch(err){
        console.error('Failed to fetch file stats', err);
        return res.status(500).end();
    }

    // its a directory, so send all sub-directories
    if(fileStat.isDirectory()){
        let dirents;
        try{ dirents = await fs.readdir(fullPath, {withFileTypes:true}) }
        catch(err){
            console.error('Failed to fetch directory contents', err);
            return res.status(500).end();
        }

        const direntNames = dirents.map(dirent => `${dirent.isFile() ? 'F' : 'D'}${dirent.name}`);

        res.write(direntNames.sort().join('\n'));
        return res.end();
    }
    
    // it's a file, so try to send the whole thing
    else{
        let fileContent;
        try{ fileContent = await fs.readFile(fullPath, 'utf-8'); }
        catch(err){
            console.error('Failed to read file contents', err);
            return res.status(500).end();
        }

        res.write(fileContent);
        return res.end();
    }
});

(async () => {
    const port = config.port || 4082;
    const address = Object.values(os.networkInterfaces()).flat().find(i => !i.internal && i.family === 'IPv4')?.address || 'localhost';

    const authUrl = `http://${address}:${port}/auth?key`;
    const qrcode = await new Promise(resolve => QRCode.toString(authUrl, {type:'utf8', errorCorrectionLevel:'L'}, (err, str) => resolve(str)));
    console.log(qrcode);

    // load certificates
    const options = {
        key:  await fs.readFile('certs/server-key.pem'),
        cert: await fs.readFile('certs/server-cert.pem'),
        ca:   await fs.readFile('certs/ca-cert.pem'), // Trust our CA
        requestCert: true, // request client certificate
        rejectUnauthorized: true, // reject if client cert is not valid
    };

    // start server
    https.createServer(options, app).listen(port, address, () => {
        console.log(`Editor Server running on https://${address}:${port}`);
    });
})();

