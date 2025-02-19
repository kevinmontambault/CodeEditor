import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    .code-line{
        font-family: var(--line-font-family);
        font-size: var(--line-font-size);
        padding: 0 5px;
        user-select: none;
        display: flex;
        align-items: center;
    }

    .code-line.selected{
        background-color: var(--editor-lineHighlightBackground);
    }

    .code-line .line-number{
        color: var(--editorLineNumber-foreground);
        width: var(--line-number-gutter-width);
    }

    .code-line.selected .line-number{
        color: var(--editorLineNumber-activeForeground);
    }
    
    .code-line .line-content{
        border-right: 3px solid transparent;
        height: 100%;
    }
    
    .code-line .text-content{
        font-family: var(--line-font-family);
        margin: 0;
    }
`);

export default class CodeLine extends HTMLElement{
    static charWidth = 0;

    constructor(textContent){
        super();

        this.classList.add('code-line', 'flex-row');

        this.innerHTML = /*html*/`
            <div class="line-number"></div>
            <div class="line-content relative">
                <pre class="text-content">${textContent}</pre>
                <div class="selection-area"></div>
            </div>
        `;

        this.lineNumberContainer = this.querySelector('.line-number');
        this.lineContentContainer = this.querySelector('.line-content');
        this.textContentContainer = this.querySelector('.text-content');
        this.selectionArea = this.querySelector('.selection-area');
    };

    connectedCallback(){
        this.lineNumberContainer.innerText = this.parentTable.getRowIndex(this);
    };

    disconnectedCallback(){

    };

    insertSelectionHighlight(selectionHighlight){
        this.lineContentContainer.appendChild(selectionHighlight);
    };

    get text(){
        return this.textContentContainer.innerText;
    };

    set text(value){
        return this.textContentContainer.innerText = value;
    };

    get length(){
        return this.text.length;
    };
};
customElements.define('code-line', CodeLine);