import AddStyle from '../__common__/Style.js';
import {createHighlighter} from 'https://cdn.jsdelivr.net/npm/shiki@3.0.0/+esm'

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
        min-width: var(--line-number-gutter-width);
    }

    .code-line.selected .line-number{
        color: var(--editorLineNumber-activeForeground);
    }
    
    .code-line .line-content{
        border-right: 3px solid transparent;
        height: 100%;
    }

    .code-line .whitespace-layer{
        display: flex;
        align-items: center;
        height: 100%;
        position: absolute;
        top: 0;
        z-index: 1;
    }
    
    .code-line .text-content, .code-line .whitespace-layer{
        font-family: var(--line-font-family);
        margin: 0;
    }

    .code-line .tab{
        background-color: green;
        width: 3em;
        border: 1px solid red;
        height: 0px;
    }

    .code-line .space{
        display: inline-block;
        height: 2px;
        width: 2px;
        border-radius: 100%;
        background-color: var(--editor-background);
        opacity: .5;
    }
`);

let shiki;
createHighlighter({langs:['js'], themes:['monokai']}).then(s => shiki = s);
const shikiOptions = {lang:'js', theme:'monokai'};

function hastToHTML(hast){
    return (function closureToHTML(children){
        return children.map(child => {
            if(child.type === 'text'){ return child.value; }
            if(child.type === 'element'){ return `<${child.tagName} ${Object.entries(child.properties).map(([n, v]) => `${n}="${v}"`)}>${closureToHTML(child.children)}</${child.tagName}>`; }
            throw new Error('Unrecognized hast type', child.type);
        }).join('');
    })(hast.children[0].children[0].children[0].children);
};

// export class CodeArea extends QuickTable{
//     constructor(){
//         super();

//         this.renderLine = null;
//         this.renderQueue = null;

//         this.addEventListener('reload', ({state}) => {


//             console.log(state.rowEnd);
//         });
//     };

//     insert(text, index=-1){
//         if(index < 0){ index = this._lines.length + index + 1; }
//         this.insertRow(new CodeLine(text, this.getRow(index-1)));
//     };

//     remove(startIndex, endIndex){
//         if(endIndex < 1){ endIndex = this._lines.length + index + 1; }

//         for(const row of this._lines.slice(startIndex, endIndex)){ delete row.parentArea; }
//         this._lines.splice(startIndex, endIndex-startIndex);

//         const prevRow = this._lines[startIndex-1] || null;
//         const nextRow = this._lines[endIndex]   || null;
        
//         if(prevRow){ prevRow.nextLine = nextRow; }
//         if(nextRow){
//             nextRow.prevLine = prevRow;
//             nextRow.invalidateState();
//         }

//         this._indexesValid = false;
//         this.reload();
//     };

//     move(indexFrom, indexTo){

//     };
// };
// customElements.define('code-area', CodeArea);

export default class CodeLine extends HTMLElement{
    static tabWidth = 3;

    constructor(codeText, prevoiusLine=null){
        super();

        this.classList.add('code-line', 'flex-row');

        this.innerHTML = /*html*/`
            <div class="line-number"></div>
            <div class="line-content relative">
                <pre class="text-content"></pre>
                <pre class="whitespace-layer"></pre>
                <div class="selection-area"></div>
            </div>
        `;

        this.lineNumberContainer = this.querySelector('.line-number');
        this.lineContentContainer = this.querySelector('.line-content');
        this.textContentContainer = this.querySelector('.text-content');
        this.selectionArea = this.querySelector('.selection-area');
        this.whitespaceLayer = this.querySelector('.whitespace-layer');

        this.prevLine = prevoiusLine;
        this.nextLine = null;
        if(prevoiusLine){ prevoiusLine.nextLine = this; }

        this.text = '';

        this.connected    = false;
        this.rendered     = false;
        this.grammarState = null;

        this.positionValid = true;
        this.position = prevoiusLine ? prevoiusLine.getDocPosition()+prevoiusLine.length : 0;

        this.setText(codeText);
    };

    connectedCallback(){
        this.connected = true;
        this.render();
    };

    disconnectedCallback(){
        this.connected = false;
    };

    insertSelectionHighlight(selectionHighlight){
        this.lineContentContainer.appendChild(selectionHighlight);
    };

    setText(content){
        this.text = content;

        this.invalidateState();
        this.render();

        // const halfMargin = (CodeLine.charWidth-2) / 2;
        // let gap = 0;
        // this.whitespaceLayer.innerHTML = this.textContentContainer.innerText.split('').map(c => {
        //     if(c === '\t'){ 
        //         const line = `<span class="tab" style="margin-left:${gap*CodeLine.charWidth}px; width=${CodeLine.charWidth*CodeLine.tabWidth}px">   </span>`;
        //         gap = 0;
        //         return line;
        //     }

        //     if(c === ' '){
        //         const line = `<span class="space" style="margin-left:${gap*CodeLine.charWidth + halfMargin}px; margin-right:${halfMargin}px"> </span>`;
        //         gap = 0;
        //         return line;
        //     }

        //     gap += 1;
        // }).join('');
    };

    invalidateState(){
        if(!this.rendered){ return; }

        this.rendered      = false;
        this.positionValid = false;
        this.grammarState  = null;
        this.hast          = null;

        this.nextLine?.invalidateState();
    };

    render(){
        if(!this.connected){ return false; }
        if(this.rendered){ return true; }

        const options = this.prevLine ? Object.assign({grammarState:this.prevLine.getGrammarState()}, shikiOptions) : shikiOptions;
        const hast = shiki.codeToHast(this.text, options);

        this.textContentContainer.innerHTML = hastToHTML(hast);
        this.lineNumberContainer.innerText = this.parentArea.getLineIndex(this);

        this.rendered = true;
        this.nextLine?.render();
        return true;
    };

    getGrammarState(){
        if(this.grammarState){ return this.grammarState; }
        const options = this.prevLine ? Object.assign({grammarState:this.prevLine.getGrammarState()}, shikiOptions) : shikiOptions;
        return this.grammarState = shiki.getLastGrammarState(this.text, options);
    };

    getDocPosition(){
        if(this.positionValid){ return this.position; }

        this.position = prevoiusLine ? prevoiusLine.getDocPosition()+prevoiusLine.length : 0;
        this.positionValid = true;
        return this.position;
    };

    get length(){
        return this.text.length;
    };

    get charWidth(){
        return this.parentArea.fontWidth;
    };
};
customElements.define('code-line', CodeLine);