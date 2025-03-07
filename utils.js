const crypto  = require('crypto');
const path = require('path');

module.exports.expressEncryptMiddleware = credentials => async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'X-IV,X-HMAC');

    // ensure proper headers
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
        const calculatedHMAC = crypto.createHmac('sha256', credentials.hmacKey).update(Buffer.concat([receivedIV, receivedBytes, Buffer.from(req.path)])).digest();
        if(calculatedHMAC.length !== receivedHMAC.length){ return res.status(400).end(); }
        if(!crypto.timingSafeEqual(receivedHMAC, calculatedHMAC)){ return res.status(400).end(); }
    }catch(err){
        return res.status(400).end();
    }

    // decrypt message
    try{
        const decipher = crypto.createDecipheriv('aes-256-cbc', credentials.aesKey, receivedIV);
        req.body = Buffer.concat([decipher.update(receivedBytes), decipher.final()]).toString();
    }catch(err){
        return res.status(400).end();
    }

    const oldSend = res.send.bind(res);
    res.send = body => {
        oldSend(body);
    };

    next();
};

module.exports.validatePath = root => filePath => {
    const rootPath = path.normalize(root);
    const fullPath = path.normalize(path.join(rootPath, decodeURIComponent(filePath)));
    if(fullPath.startsWith(rootPath)){ return fullPath; }
    return null;
};