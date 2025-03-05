export function load(folderName){
    const data = localStorage.getItem(folderName);
    if(!data){ return null; }
    return JSON.parse(data);
};

export function set(folderName, state){
    localStorage.setItem(folderName, state);
};