export default class ExitSession extends HTMLElement{
    static icon = /*html*/`<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M800-120q33 0 56.5-23.5T880-200V-760q0-33-23.5-56.5T800-840H520v80H800v560H520v80H800ZM360-280l55-58L313-440H640v-80H313L415-622l-55-58L160-480 360-280Z"/></svg>`;
    static name = 'exit-session';
    static command = () => {
        document.exitFullscreen();
    };
};
customElements.define('exit-session', ExitSession);