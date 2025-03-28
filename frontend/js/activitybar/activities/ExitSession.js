export default class ExitSession extends HTMLElement{
    static icon = /*html*/`<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M675-120q33 0 56.5-23.5T755-200V-760q0-33-23.5-56.5T675-840H395v80H675v560H395v80H675ZM235-280l55-58L188-440H515v-80H188l102-102-55-58L35-480 235-280Z"/></svg>`;
    static name = 'exit-session';
    static active = window.location.hash.slice(1).length > 0;

    static command = async () => {
        try{ await document.exitFullscreen(); }catch(err){}
        window.location.href = window.location.hash.slice(1);
    };
};
customElements.define('exit-session', ExitSession);