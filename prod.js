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

function validatePath(filePath){
    const rootPath = path.normalize(config.root);
    const fullPath = path.normalize(path.join(rootPath, decodeURIComponent(filePath)));
    if(fullPath.startsWith(rootPath)){ return fullPath; }
    return false;
};

async function sendFile(filePath){
    const fullPath = validatePath(filePath);
    if(!fullPath){ throw new Error('Invalid Path'); }
    return await fs.readFile(fullPath, 'utf-8');
};

async function sendFolder(folderPath){
    const fullPath = validatePath(folderPath);
    if(!fullPath){ throw new Error('Invalid Path'); }

    const dirents = await fs.readdir(fullPath, {withFileTypes:true});
    const direntNames = dirents.map(dirent => `${dirent.isFile() ? 'F' : 'D'}${dirent.name}`);

    return direntNames.sort().join('\n');
};

async function updateFile(filePath, deltas){
    const fullPath = validatePath(filePath);
    if(!fullPath){ throw new Error('Invalid Path'); }

    return '';
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
            try{ return res.status(200).send(encryptResponse(await sendFile(decryptedMessage.slice(1)))); }
            catch(err){ console.log(err); return res.status(500).end(); }
        }

        case 'D': {
            try{ return res.status(200).send(encryptResponse(await sendFolder(decryptedMessage.slice(1)))); }
            catch(err){ console.log(err); return res.status(500).end(); }
        }

        case 'U': {
            try{ return res.status(200).send(encryptResponse()); }
            catch(err){ console.log(err); return res.status(500).end(); }
        }

        default: {
            return res.status(400).end();
        }
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

    const hostUrl = `http://192.168.0.11:52066/CodeEditor/?h=${encodeURIComponent(config.host)}&e=${aesKey.toString('base64url')}&m=${hmacKey.toString('base64url')}`;
    // const hostUrl = `https://KevinMontambault.github.io/CodeEditor/?h=${config.host}&e=${aesKey.toString('base64')}&m=${hmacKey.toString('base64')}`;
    qrcode.generate(hostUrl, {small:true}, console.log);
    console.log(hostUrl, '\n\n');

    const port = 4001;
    const server = app.listen(port, () => console.log(`App running ${port}`));
})();

