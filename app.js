const fs      = require('fs');
const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
const qrcode  = require('qrcode-terminal');

const Utils = require(path.join(__dirname, 'utils.js'));

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
const encryptMiddleware = Utils.expressEncryptMiddleware({aesKey, hmacKey});
const validatePath = Utils.validatePath(config.root);

// allow requests from all origins
app.use('/', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.post('/c/folder', encryptMiddleware, async (req, res) => {

});

// fetch the subdirectories in a folder
app.post('/r/folder', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).send('Invalid Path'); }

    let dirents;
    try{ dirents = await fs.promises.readdir(fullPath, {withFileTypes:true}); }
    catch(err){ console.error(err); return res.status(500).send('Read Error'); }

    const direntNames = dirents.map(dirent => `${dirent.isFile() ? 'F' : 'D'}${dirent.name}`);
    res.status(200).send(direntNames.sort().join('\n'));
});

app.post('/u/folder', encryptMiddleware, async (req, res) => {
    const [path, newPath] = req.body.split('\0');

    const fullPath1 = validatePath(path);
    if(!fullPath1){ return res.status(403).send('Invalid Path'); }

    const fullPath2 = validatePath(newPath);
    if(!fullPath2){ return res.status(403).send('Invalid Path'); }

    try{ await fs.promises.rename(fullPath1, fullPath2); }
    catch(err){ console.error(err); return res.status(500).send('Unlink Error'); }

    res.status(200).end();
});

app.post('/d/folder', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).send('Invalid Path'); }
    
});

app.post('/c/file', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).send('Invalid Path'); }

    try{
        await fs.promises.fstat(fullPath);
        return res.status(400).send('File Exists');
    }catch(err){
        if(err.code !== 'ENOENT'){
            console.error(err);
            return res.status(500).send('Stat Error');
        }
    }

    try{ await fs.promises.writeFile(fullPath, ''); }
    catch(err){ return res.status(500).send('Write Error'); }

    res.status(200).send(fileContent);
});

// fetch a file's contents
app.post('/r/file', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).send('Invalid Path'); }
    
    let fileContent;
    try{ fileContent = await fs.promises.readFile(fullPath, 'utf-8'); }
    catch(err){ return res.status(500).send('Read Error'); }

    res.status(200).send(fileContent);
});

// update a file's contents
app.post('/u/file', encryptMiddleware, async (req, res) => {
    const [path, ...rawDeltas] = req.body.split('\0');

    const fullPath = validatePath(path);
    if(!fullPath){ return res.status(403).send('Invalid Path'); }

    let fileContent;
    try{ fileContent = await fs.promises.readFile(fullPath, 'utf-8'); }
    catch(err){ return res.status(500).end(); }
    fileContent = fileContent.replace(/\r/g, '');

    // normalize
    const deltas = rawDeltas.map(rawDelta => {
        const type = rawDelta.slice(0, 1);
        const [pos, ...rest] = rawDelta.slice(1).split(',');
        return [type, parseInt(pos), rest.join('')];
    });

    // apply deltas
    for(let i=0; i<deltas.length; i++){
        const [type, pos, arg] = deltas[i];

        if(type === 'D'){
            const length = parseInt(arg);
            fileContent = `${fileContent.slice(0, pos)}${fileContent.slice(pos+length)}`;
        }else if(type === 'I'){
            fileContent = `${fileContent.slice(0, pos)}${arg}${fileContent.slice(pos)}`;
        }
    }
    
    try{ await fs.promises.writeFile(fullPath, fileContent); }
    catch(err){ console.error(err); return res.status(500).end(); }
    
    res.status(200).end();
});

app.post('/d/file', encryptMiddleware, async (req, res) => {
    const fullPath = validatePath(req.body);
    if(!fullPath){ return res.status(403).send('Invalid Path'); }

    try{ await fs.promises.unlink(fullPath); }
    catch(err){ console.error(err); return res.status(500).send('Unlink Error'); }

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
