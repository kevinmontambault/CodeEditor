import forge from 'http://localhost:3000/npm/node-forge@1.3.1/+esm';

function byteStringToUint8Array(byteString) {
    const bytes = new Uint8Array(byteString.length);
    for(let i=0; i<byteString.length; i++){ bytes[i] = byteString.charCodeAt(i); }
    return bytes;
};

export default new class Remote{
    constructor(){
        this.aes  = window.atob(localStorage.getItem('e') || '');
        this.hmac = window.atob(localStorage.getItem('m') || '');

        if(!this.hmac.length || !this.aes.length){ throw new Error('Credentials not set'); }
    };

    async sendRequest(endpoint, body){
        if(!this.hmac.length || !this.aes.length){ return {success:false, error:new Error('No host is set')}; }

        const iv = forge.random.getBytesSync(16);
        const cipher = forge.cipher.createCipher('AES-CBC', this.aes);
        cipher.start({iv});
        cipher.update(forge.util.createBuffer(body));
        cipher.finish();
        const encryptedMessage = cipher.output.getBytes();
        
        const hmac = forge.hmac.create();
        hmac.start('sha256', this.hmac);
        hmac.update(iv + encryptedMessage + endpoint);
        const hmacResult = hmac.digest().getBytes();

        let response;
        try{ response = await fetch(endpoint, {method:'POST', body:byteStringToUint8Array(encryptedMessage), headers:{'x-iv':window.btoa(iv), 'x-hmac':window.btoa(hmacResult)}}); }
        catch(err){ return {success:false, error:err}; }
        if(!response.ok){ return {success:false, error:new Error(`Bad status (${response.status})`)}; }
        
        let text;
        try{ text = await response.text(); }
        catch(err){ return {success:false, error:err}; }

        return {success:true, text};
    };

    async readFolder(path){
        return await this.sendRequest('/folder', path);
    };
    
    async readFile(path){
        return await this.sendRequest('/file', path);
    };
    
    async updateFile(){
        return await this.sendRequest('/', `U${''}`);
    };
};