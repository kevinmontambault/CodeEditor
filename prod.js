const fs      = require('fs').promises;
const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
const qrcode  = require('qrcode-terminal');

const config = require(path.join(__dirname, 'config.json'));

const app = express();

let aesKey  = null;
let hmacKey = null;

function encryptResponse(response){
    return response;
};

app.use('/', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-IV,X-HMAC');
    next();
});

app.post('/', async (req, res) => {
    if(!req.headers['x-iv']){ return res.status(400).end(); }
    if(!req.headers['x-hmac']){ return res.status(400).end(); }

    // get request params
    const receivedIV   = Buffer.from(req.headers['x-iv'], 'base64');
    const receivedHMAC = Buffer.from(req.headers['x-hmac'], 'base64');

    // get body
    const receivedBytes = await new Promise(resolve => {
        const data = [];
        req.on('data', chunk => data.push(chunk));
        req.on('end', () => resolve(Buffer.concat(data)));
    });
    if(!receivedBytes.length){ return res.status(400).end(); }

    // validate HMAC
    try{
        const calculatedHMAC = crypto.createHmac('sha256', hmacKey).update(Buffer.concat([receivedIV, receivedBytes])).digest();
        if(calculatedHMAC.length !== receivedHMAC.length){ return res.status(400).end(); }
        if(!crypto.timingSafeEqual(receivedHMAC, calculatedHMAC)){ return res.status(400).end(); }
    }catch(err){
        return res.status(400).end();
    }

    // decrypt message
    let decryptedMessage;
    try{
        const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, receivedIV);
        decryptedMessage = Buffer.concat([decipher.update(receivedBytes), decipher.final()]).toString();
    }catch(err){
        return res.status(400).end();
    }

    // handle message
    switch(decryptedMessage.charAt(0)){
        case 'F': {
            try{ return res.status(200).send(encryptResponse()); }
            catch(err){ return res.status(500).end(); }
        }

        case 'D': {
            try{ return res.status(200).send(encryptResponse()); }
            catch(err){ return res.status(500).end(); }
        }

        case 'U': {
            try{ return res.status(200).send(encryptResponse()); }
            catch(err){ return res.status(500).end(); }
        }

        default: {
            return res.status(400).end();
        }
    }
});

// get a mounted directory
app.get('/drive*', async (req, res) => {
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
    const keysPath = path.join(__dirname, 'keys');
    let keyContent;
    try{ keyContent = await fs.readFile(keysPath); }
    catch(err){
        if(err.code !== 'ENOENT'){ throw err; }
        keyContent = crypto.randomBytes(64);
        await fs.writeFile(keysPath, keyContent);
    }

    aesKey  = keyContent.subarray(0, 32);
    hmacKey = keyContent.subarray(32, 64);

    const hostUrl = `https://KevinMontambault.github.io/CodeEditor?h=${config.host}&e=${aesKey.toString('base64')}&h=${hmacKey.toString('base64')}`;
    qrcode.generate(hostUrl, {small:true}, console.log);

    const port = 4001;
    const server = app.listen(port, () => console.log(`App running ${port}`));
})();

