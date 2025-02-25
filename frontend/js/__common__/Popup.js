import AddStyle from './Style.js';

AddStyle(/*css*/`
    .popup:before{
        position: fixed;
        width: 100dvw;
        height: 100dvh;
        background-color: #0004;
    }
`);

export default class Popup extends HTMLElement{
    static showingStack = [];

    constructor(){
        this.classList.add('popup');
        
        Popup.showingStack.push(this);

        if(this.showingStack.length === 1){
            document.body.appendChild(this);
        }
    };

    disconnectedCallback(){
        Popup.showingStack.splice(0, 1);

        if(this.showingStack.length > 0){
            document.body.appendChild(this.showingStack[0]);
        }
    };
};
customElements.define('custom-popup', Popup);