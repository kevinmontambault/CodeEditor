import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    @keyframes blink{
        0%, 100% { background-color: var(--editorCursor-foreground); }
        50% { background-color: transparent; }
    }

    .editor-context.focused .editor-cursor{
        animation: blink 1000ms infinite step-end;
    }
    
    .editor-cursor{
        width: 1px;
        position: absolute;
        top: 2px;
        bottom: 2px;
        left: 0px;
        background-color: transparent;
    }
`);

export default class Cursor extends HTMLElement{
    static characterWidth = 0;

    constructor(line=null, column=0){
        super();

        this.classList.add('editor-cursor');

        this.style.animationDelay = `${-(Date.now() % 1000)}ms`;

        this._column = 0;
        this.column = column;

        this.setLine(line);
    };

    setLine(newLine, column=null){
        this.line = newLine;
        this.line?.addCursor(this);

        if(column !== null){  this.column = column;}
    };

    get column(){
        return this._column;
    };

    set column(value){
        this.style.left = `${Math.round(value * Cursor.characterWidth)}px`;
        return this._column = value;
    };

    updateFontSize(size){
        this.style.left = `${Math.round(this.column * size.width)}px`;
    };
};
customElements.define('editor-cursor', Cursor);