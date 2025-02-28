import AddStyle from '../../__common__/Style.js';

AddStyle(/*css*/`
    body.fullscreen .enter-fullscreen-button{
        display: none;
    }

    body:not(.fullscreen) .exit-fullscreen-button{
        display: none;
    }
`);

document.addEventListener('fullscreenchange', () => document.body.classList.toggle('fullscreen', document.fullscreenElement));

export default class ToggleFullscreen extends HTMLElement{
    static icon = /*html*/`
        <svg class="enter-fullscreen-button" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"/></svg>
        <svg class="exit-fullscreen-button"  xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/></svg>
    `;

    static name = 'toggle-fullscreen';

    static command = async () => {
        try{ await (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()); }
        catch(err){ console.error(err); }
    };
};
customElements.define('toggle-fullscreen', ToggleFullscreen);