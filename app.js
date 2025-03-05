const fs      = require('fs');
const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
const qrcode  = require('qrcode-terminal');
const encrypt = require('E:/Desktop/Libraries/Node/ExpressEncrypt');

const config = require(path.join(__dirname, 'config.json'));
const baseUrl = `${config.host}:${config.port}`;

const app = express();

// read / generate encryption keys
const keysPath = path.join(__dirname, 'keys');
let keyContent;
try{ keyContent = fs.readFileSync(keysPath); }
catch(err){
    if(err.code !== 'ENOENT'){ throw err; }
    keyContent = crypto.randomBytes(64);
    fs.writeFileSync(keysPath, keyContent);
}
const aesKey  = keyContent.subarray(0,  32);
const hmacKey = keyContent.subarray(32, 64);
const encryptMiddleware = encrypt({aesKey, hmacKey});

function validatePath(filePath){
    const rootPath = path.normalize(config.root);
    const fullPath = path.normalize(path.join(rootPath, decodeURIComponent(filePath)));
    if(fullPath.startsWith(rootPath)){ return fullPath; }
    return false;
};

async function updateFile(filePath, deltas){
    const fullPath = validatePath(filePath);
    if(!fullPath){ throw new Error('Invalid Path'); }

    return '';
};

// allow requests from all origins
app.use('/', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-IV,X-HMAC');
    next();
});

// fetch the subdirectories in a folder
app.post('/folder', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).end(); }

    const dirents = await fs.promises.readdir(fullPath, {withFileTypes:true});
    const direntNames = dirents.map(dirent => `${dirent.isFile() ? 'F' : 'D'}${dirent.name}`);

    res.status(200).send(direntNames.sort().join('\n'));
});

// fetch a file's contents
app.post('/file', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).end(); }
    
    let fileContent;
    try{ fileContent = await fs.promises.readFile(fullPath, 'utf-8'); }
    catch(err){ return res.status(500).end(); }

    res.status(200).send(fileContent);
});

// update a file's contents
app.post('/update', encryptMiddleware, async (req, res) => {
    const [path, ...rawDeltas] = req.body.split('\0');

    const fullPath = validatePath(path);
    if(!fullPath){ return res.status(403).end(); }

    let fileContent;
    try{ fileContent = await fs.promises.readFile(fullPath, 'utf-8'); }
    catch(err){ return res.status(500).end(); }
    fileContent = fileContent.replace(/\r/g, '');

    // normalize
    const deltas = rawDeltas.map(rawDelta => {
        const type = rawDelta.slice(0, 1);
        const [pos, ...rest] = rawDelta.slice(1).split(',');
        return [type, parseInt(pos)+1, rest.join('')];
    });

    // apply deltas
    for(let i=0; i<deltas.length; i++){
        const [type, pos, arg] = deltas[i];

        if(type === 'D'){
            const length = parseInt(arg);
            fileContent = `${fileContent.slice(0, pos-1)}${fileContent.slice(pos+length-1)}`;
        }else if(type === 'I'){
            fileContent = `${fileContent.slice(0, pos)}${arg}${fileContent.slice(pos)}`;
        }
    }
    
    try{ await fs.promises.writeFile(fullPath, fileContent); }
    catch(err){ console.error(err); return res.status(500).end(); }
    
    res.status(200).end();
});

// shell connection
app.post('/shell', encryptMiddleware, (req, res) => {
    console.log(req.body)
});

// entrypoint registers new host
app.get('/', async (req, res) => {
    let registerFile;
    try{ registerFile = await fs.promises.readFile(path.join(__dirname, 'frontend/register.html'), 'utf-8'); }
    catch(err){ console.log(err); return res.status(500).end(); }

    res.send(registerFile.replace('{{NAME}}', config.name).replace('{{HOST}}', baseUrl).replace('{{HOST_MANAGER}}', config.hostManager||''));
});

// static files/resources
app.use('/static', express.static(path.join(__dirname, 'frontend/static')));
app.use('/js',     express.static(path.join(__dirname, 'frontend/js')));
app.get('/editor', (req, res) => res.sendFile(path.join(__dirname, 'frontend/editor.html')));
app.get('/hosts',  (req, res) => res.sendFile(path.join(__dirname, '/docs/index.html')));

// provide keys for connecting in terminal
const hostUrl = `${baseUrl}#${aesKey.toString('base64url')}#${hmacKey.toString('base64url')}`;
console.log(hostUrl);
qrcode.generate(hostUrl, {small:true}, console.log);

// start server
const server = app.listen(config.port, () => console.log(`App running ${config.port}`));
