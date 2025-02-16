
export async function sendRequest(...args){

    // Authorization: SID=<SID>, Signature=<HMAC(S, nonce + request data)>, Nonce=<current_timestamp>


    let response;
    try{ response = await fetch(...args); }
    catch(err){ return {success:false, error:err}; }

    let text;
    try{ text = await response.text(); }
    catch(err){ return {success:false, error:err}; }

    let data;
    try{ data = JSON.parse(text); }
    catch(err){ return {success:true, text}; }

    return Object.assign({success:true}, data);
};

export function zPad(string, c=2){
    return string.toString().padStart(c, '0');
};