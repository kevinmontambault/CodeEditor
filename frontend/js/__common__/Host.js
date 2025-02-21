function base64ToUint8Array(string){
    const binaryString = window.atob(string);
    const bytes = new Uint8Array(binaryString.length);
    for(let i=0; i<binaryString.length; i++){ bytes[i] = binaryString.charCodeAt(i); }
    return bytes;
};

function uint8ArrayToBase64(array){
    return btoa(Array.from(array, c => String.fromCharCode(c)).join(''));
};

export default new class Host{
    constructor(){
        this.hosts = [{
            url: 'http://localhost:4001',
            aes: 'zY8UNviN4nBspMKqrgGMceqZlJCsUXA0fqs21Zylka8=',
            hmac: '7yBTnS1IguZEmfoJeP+daa1yHmYcj/qvuZp68DAfUvM='
        }];

        this.setHost(0); // TODO: temp
    };

    setHost(index){
        if(index >= this.hosts.length){ return false; }

        this.hmac = base64ToUint8Array(this.hosts[index].hmac);
        this.aes  = base64ToUint8Array(this.hosts[index].aes);
        this.url  = this.hosts[index].url;
    };

    async sendRequest(messageText){
        const aesKey  = await window.crypto.subtle.importKey('raw', this.aes,  {name:'AES-CBC'}, false, ['encrypt', 'decrypt']);
        const hmacKey = await window.crypto.subtle.importKey('raw', this.hmac, {name:'HMAC', hash:'SHA-256'}, false, ['sign', 'verify']);
        
        const encryptIV = window.crypto.getRandomValues(new Uint8Array(16));
        const encryptedMessage = new Uint8Array(await window.crypto.subtle.encrypt({name:'AES-CBC', iv:encryptIV}, aesKey, new TextEncoder().encode(messageText)));

        console.log(encryptedMessage)
        
        const hmacMessage = new Uint8Array([...encryptIV, ...encryptedMessage]);
        const hmac = new Uint8Array(await window.crypto.subtle.sign('HMAC', hmacKey, hmacMessage));

        let response;
        try{ response = await fetch(this.url, {method:'POST', body:encryptedMessage, headers:{'x-iv':uint8ArrayToBase64(encryptIV), 'x-hmac':uint8ArrayToBase64(hmac)}}); }
        catch(err){ return {success:false, error:err}; }
        if(!response.ok){ return {success:false, error:new Error(`Bad status (${response.status})`)}; }
        
        let text;
        try{ text = await response.text(); }
        catch(err){ return {success:false, error:err}; }

        return {success:true, text};
    };

    async readFolder(path){
        return await this.sendRequest(`D${path}`);
    };
    
    async readFile(path){
        return await this.sendRequest(`F${path}`);
    };
    
    async updateFile(){
        return await this.sendRequest(`U${''}`);
    };
};