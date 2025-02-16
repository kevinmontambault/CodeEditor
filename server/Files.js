const fs = require('fs').promises;

const SAMPLE_SIZE = 4096;
const THRESHHOLD = 0.1;

module.exports.isTextFile = async function(filePath){
    let fd;
    try{ fd = await fs.open(filePath); }
    catch(error){ return {success:false, error}; }

    let bytesRead;
    const buffer = Buffer.alloc(SAMPLE_SIZE);
    try{ bytesRead = fs.read(fd, buffer, 0, SAMPLE_SIZE, 0); }
    catch(error){ return {success:false, error}; }

    await fs.close(fd);

    if(!bytesRead){ return {success:true, editable:true}; }

    const threshhold = bytesRead * THRESHHOLD;
    let nonTextCount = 0;
    for (let i=0; i<bytesRead; i++){
        const byte = buffer[i];

        // if a null byte is encountered, assume binary
        if(!byte){ return {success:true, editable:false}; }

        // if there are too many non-text characters (not including whitespaces), assume binary
        if((byte<32 && byte!==9 && byte!==10 && byte!==13) && ++nonTextCount > threshhold){ return {success:true, editable:false}; }
    }

    return {success:true, editable:true};
}
