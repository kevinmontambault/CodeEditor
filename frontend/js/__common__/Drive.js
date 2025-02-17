export default new class Drive extends EventTarget{
    static host = '192.168.0.23';
    static port = '4001';

    async read(path){
        let response;
        try{ response = await fetch(`http://${Drive.host}:${Drive.port}/fs/${path}`); }
        catch(err){ return {success:false, error:err}; }
        if(!response.ok){ return {success:false, error:new Error(`Bad status (${response.status})`)}; }

        let text;
        try{ text = await response.text(); }
        catch(err){ return {success:false, error:err}; }

        return {success:true, text};
    };

    async readFolder(path){
        return await this.read(path);
    };
    
    async readFile(path){
        return await this.read(path);
    };

    async updateFile(){

    };
};