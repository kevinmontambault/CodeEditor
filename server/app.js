const fs = require('fs').promises;
const path = require('path');
const express = require('express');

const config = require(path.join(__dirname, '../config.json'));

const app = express();
app.use(express.json());

// get a mounted directory
app.get('/fs/*', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const rootPath = path.normalize(config.root);
    const fullPath = path.normalize(path.join(rootPath, decodeURIComponent(req.url.slice(4))));
    
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

const server = app.listen(4001, () => console.log('App running'));
