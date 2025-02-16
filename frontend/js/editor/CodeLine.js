import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    .code-line{
        gap: 10px;
        font-family: 'Cascadia Mono', monospace;
        font-size: .7rem;
        padding: 0 5px;
        pointer-events: all;
    }

    .code-line.selected{
        background-color: var(--editor-lineHighlightBackground);
    }

    .code-line .line-number{
        color: var(--editorLineNumber-foreground);
    }

    .code-line.selected .line-number{
        color: var(--editorLineNumber-activeForeground);
    }
    
    .code-line .line-content{
        border-right: 3px solid transparent;
    }
    
    .code-line .text-content{
        font-family: 'Cascadia Mono', monospace;
        margin: 0;
    }
`);

export default class CodeLine extends HTMLElement{
    constructor(textContent){
        super();

        this.classList.add('code-line', 'flex-row');

        this.innerHTML = /*html*/`
            <div class="line-number"></div>
            <div class="line-content relative">
                <pre class="text-content">${textContent}</pre>
            </div>
        `;

        this.lineNumberContainer = this.querySelector('.line-number');
        this.lineContentContainer = this.querySelector('.line-content');
        this.textContentContainer = this.querySelector('.text-content');
    };

    connectedCallback(){
        this.lineNumberContainer.innerText = this.parentTable.getRowIndex(this);
    };

    disconnectedCallback(){

    };

    addCursor(cursor){
        this.lineContentContainer.appendChild(cursor);
    };

    // removes cursors that have the same column as another cursor
    consolidateCursors(){
        const cursors = this.cursors;
        for(let i=0; i<cursors.length; i++){
            for(let j=cursors.length-1; j>i; j--){
                if(cursors[j].column === cursors[i].column){
                    cursors[j].remove();
                }
            }
        }
    };

    getOffsetX(clientX){
        return clientX - this.lineContentContainer.getBoundingClientRect().left;
    };

    get text(){
        return this.textContentContainer.innerText;
    };

    set text(value){
        return this.textContentContainer.innerText = value;
    };

    get cursors(){
        return Array.from(this.lineContentContainer.children).slice(1);
    };

    get length(){
        return this.text.length;
    };
};
customElements.define('code-line', CodeLine);