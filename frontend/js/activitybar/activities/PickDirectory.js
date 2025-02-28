import AddStyle from '/js/__common__/Style.js';
import Popup from '/js/__common__/Popup.js';

AddStyle(/*css*/`
    .pick-directory-popup{
        width: 350px;
        height: 450px;
    }

    .pick-directory-popup .button-container{
        justify-content: center;
        gap: 5px;
    }

    .pick-directory-popup .button-container>div{
        cursor: pointer;
        background-color: purple;
        color: white;
        padding: 3px 5px;
        width: 100px;
    }
`);

class PickDirectoryPopup extends Popup{
    constructor(){
        super();

        this.classList.add('pick-directory-popup', 'flex-col');

        this.innerHTML = `
            <div></div>

            <div class="button-container flex-row">
                <div class="cancel-button pointer-events flex-center">Cancel</div>
                <div class="open-button pointer-events flex-center">Open</div>
            </div>
        `;

        this.querySelector('.cancel-button').addEventListener('click', () => this.remove());
    };
};
customElements.define('pick-directory-popup', PickDirectoryPopup);


export default class PickDirectory extends HTMLElement{
    static icon = /*html*/`<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z"/></svg>`;
    static name = 'pick-directory';

    static command = async () => {
        try{ await document.exitFullscreen(); }catch(err){}

        new PickDirectoryPopup();
    };
};
customElements.define('pick-directory', PickDirectory);