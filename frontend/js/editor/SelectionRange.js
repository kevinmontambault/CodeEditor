import AddStyle from '../__common__/Style.js';
import CodeLine from './CodeLine.js';

AddStyle(/*css*/`
    .selection-range-highlight{
        position: absolute;
        top: 0;
        bottom: 0;
        background-color: #FFFFFF44;
        min-width: calc(var(--line-font-width) * 0.4);
    }

    @keyframes cursor-blink{
        0%, 49% { opacity: 1; }
        50%, 100%{ opacity: 0; }
    } 

    .selection-range-highlight .cursor{
        border-right: 1px solid white;
        height: 100%;
        width: 0;
        animation: cursor-blink 1.5s infinite;
    }
`);

export class SelectionRangeHighlight extends HTMLElement{
    constructor(line, head, tail, cursor=false){
        super();

        this.classList.add('selection-range-highlight');

        if(cursor){
            this.innerHTML = /*html*/`<div class="cursor" style="left:${tail * CodeLine.charWidth}"></div>`;
        }

        if(head < tail){
            this.style.left = `${head * CodeLine.charWidth}px`;
            this.style.width = `${(tail-head) * CodeLine.charWidth}px`;
        }else{
            this.style.left = `${tail * CodeLine.charWidth}px`;
            this.style.width = `${(head-tail) * CodeLine.charWidth}px`;
        }
        line.insertSelectionHighlight(this);
    };
};
customElements.define('selection-range-highlight', SelectionRangeHighlight);

export default class SelectionRange{
    constructor(head, tail){
        if(head.col < 0){ head.col = 0; }
        if(tail === null){ tail = head; }
        else if(tail.col < 0){ tail.col = 0; }

        this.head = head;
        this.tail = tail;

        this.highlights = [];
    };

    apply(lines){
        this.clear();

        if(this.head.line === this.tail.line){
            this.highlights.push(new SelectionRangeHighlight(lines[this.tail.line], this.head.col, this.tail.col, true));
        }
        
        else{
            const startLine = lines[this.head.line];
            this.highlights.push(new SelectionRangeHighlight(startLine, this.head.col, startLine.length, true));
            
            if(this.head.line > this.tail.line){
                for(let lineIndex=this.head.line-1; lineIndex>this.tail.line; lineIndex--){
                    this.highlights.push(new SelectionRangeHighlight(lines[lineIndex], 0, lines[lineIndex].length));
                }
            }else{
                for(let lineIndex=this.head.line+1; lineIndex<this.tail.line; lineIndex++){
                    this.highlights.push(new SelectionRangeHighlight(lines[lineIndex], 0, lines[lineIndex].length));
                }
            }
            
            const endLine = lines[this.tail.line];
            this.highlights.push(new SelectionRangeHighlight(endLine, 0, this.tail.col));
        }
    };

    clear(){
        for(const highlight of this.highlights){ highlight.remove(); }
        this.highlights = [];
    };
};