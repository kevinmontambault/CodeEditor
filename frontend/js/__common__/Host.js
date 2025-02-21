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
        this.hosts = JSON.parse(localStorage.getItem('hosts') || '[]');

        // add any hosts that might be in the query params
        const params = new URLSearchParams(window.location.search);
        if(params.has('h') && params.has('e') && params.has('m')){
            const url  = decodeURIComponent(params.get('h'));
            const aes  = params.get('e').replace(/-/g, '+').replace(/_/g, '/');
            const hmac = params.get('m').replace(/-/g, '+').replace(/_/g, '/');

            const existingHost = this.hosts.find(host => host.url === url);
            if(existingHost){
                existingHost.url  = url;
                existingHost.aes  = aes;
                existingHost.hmac = hmac;
            }else{
                let newHostName = 'New Host';
                let i = 0;
                while(this.hosts.find(host => host.name === newHostName)){ newHostName = `New Host ${+i}`; }

                this.hosts.push({name:newHostName, url, aes, hmac});
                localStorage.setItem('hosts', JSON.stringify(this.hosts));
            }
        }

        this.hostIndex = -1;
        this.hmac = null;
        this.aes  = null;
        this.url  = null;

        if(this.hosts.length){ this.setHost(parseInt(localStorage.getItem('lastHost')||0)); }
    };

    setHost(index){
        if(index >= this.hosts.length){ return false; }
        this.hostIndex = index;

        localStorage.setItem('lastHost', this.hostIndex);

        this.hmac = base64ToUint8Array(this.hosts[index].hmac);
        this.aes  = base64ToUint8Array(this.hosts[index].aes);
        this.url  = this.hosts[index].url;
    };

    removeHost(index){
        this.hosts.splice(index, 1);
        if(index === this.hostIndex){
            this.hostIndex = -1;
            this.hmac = null;
            this.aes  = null;
            this.url  = null;
        }else if(index < this.hostIndex){
            this.hostIndex -= 1;
        }

        localStorage.setItem('hosts', JSON.stringify(this.hosts));
    };

    async sendRequest(messageText){
        if(this.hostIndex < 0){ return {success:false, error:new Error('No host is set')}; }
        
        const aesKey  = await window.crypto.subtle.importKey('raw', this.aes,  {name:'AES-CBC'}, false, ['encrypt', 'decrypt']);
        const hmacKey = await window.crypto.subtle.importKey('raw', this.hmac, {name:'HMAC', hash:'SHA-256'}, false, ['sign', 'verify']);
        
        const encryptIV = window.crypto.getRandomValues(new Uint8Array(16));
        const encryptedMessage = new Uint8Array(await window.crypto.subtle.encrypt({name:'AES-CBC', iv:encryptIV}, aesKey, new TextEncoder().encode(messageText)));
        
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