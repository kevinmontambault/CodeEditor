import AddStyle from './Style.js';

AddStyle(/*css*/`
    .backdrop{
        position: fixed;
        top: 0;
        left: 0;
        width: 100dvw;
        height: 100dvh;
        background-color: #0006;
    }

    .popup{
        background-color: var(--editor-background);
        border-radius: 5px;
    }
`);

export default class Popup extends HTMLElement{
    static showingStack = [];
    static backdrop = document.createElement('div');

    static hide(){
        Popup.showingStack[0]?.remove();
    };

    constructor(){
        super();

        this.classList.add('popup', 'pointer-events');
        
        Popup.showingStack.push(this);

        if(Popup.showingStack.length === 1){
            Popup.backdrop.appendChild(this);
            Popup.backdrop.classList.remove('hidden');
        }

        this.addEventListener('click', clickEvent => clickEvent.stopImmediatePropagation());
    };

    disconnectedCallback(){
        Popup.showingStack.splice(0, 1);

        if(Popup.showingStack.length > 0){ Popup.backdrop.appendChild(Popup.showingStack[0]); }
        else{ Popup.backdrop.classList.add('hidden'); }
    };
};
customElements.define('custom-popup', Popup);

Popup.backdrop.classList.add('backdrop', 'flex-center', 'pointer-events', 'hidden');
document.body.appendChild(Popup.backdrop);

Popup.backdrop.addEventListener('click', () => Popup.hide());