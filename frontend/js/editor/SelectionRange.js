import AddStyle from '../__common__/Style.js';
import Position from './Position.js';

AddStyle(/*css*/`
    .selection-range-highlight{
        position: absolute;
        top: 0;
        bottom: 0;
        background-color: #FFFFFF44;
        box-sizing: border-box;
        min-width: .3em;
    }

    .selection-range-highlight.empty{
    }

    @keyframes cursor-blink{
        0%, 49% { border-color: #FFFFFFFF; }
        50%, 100%{ border-color: #FFFFFF00; }
    }

    .selection-range-highlight.cursor-right, .selection-range-highlight.cursor-left{
        min-width: 0;
    }

    .selection-range-highlight.cursor-right::before{
        content: "";
        position: absolute;
        right: -1px;
        animation: cursor-blink 1.5s infinite;
        border-width: 2px;
        border-color: #FFFFFFFF;
        border-right-style: solid;
        height: 100%;
    }
    
    .selection-range-highlight.cursor-left::before{
        content: "";
        position: absolute;
        animation: cursor-blink 1.5s infinite;
        border-width: 2px;
        border-color: #FFFFFFFF;
        border-left-style: solid;
        height: 100%;
    }
`);

export class SelectionRangeHighlight extends HTMLElement{
    constructor(line, start, end, cursor=null){
        super();

        this.classList.add('selection-range-highlight');

        this.style.left = `${Math.min(line.length, start) * line.charWidth}px`;
        this.style.width = `${(Math.min(line.length, end)-start) * line.charWidth}px`;

        this.cursorClass = cursor==='left' ? 'cursor-left' : cursor==='right' ? 'cursor-right' : null;
        if(this.cursorClass){ this.classList.add(this.cursorClass); }

        line.insertSelectionHighlight(this);
    };

    resetAnimation(){
        if(this.cursorClass){
            this.classList.remove(this.cursorClass);
            void(this.offsetWidth);
            this.classList.add(this.cursorClass);
        }
    };
};
customElements.define('selection-range-highlight', SelectionRangeHighlight);

export default class SelectionRange{
    static mergeRanges(ranges){
        ranges.sort((a, b) => Position.lessThan(a.start, b.start) ? -1 : 1);
        return SelectionRange.mergeSortedRanges(ranges);
    };

    // merges ranges without a sort operation
    static mergeSortedRanges(ranges){
        const kept = [...ranges];
        for(let i=kept.length-1; i>=1; i--){
            if(!kept[i-1].contains(kept[i].start)){ continue; }

            if(kept[i]._rightFacing){ kept[i-1].update(null, kept[i].end); }
            else{ kept[i-1].update(kept[i].end, kept[i-1].start); }
            
            kept.splice(i, 1);
        }

        return kept;
    };

    constructor(editor, start, end=null){
        this._editor = editor;
        this._rendered = false;

        this._highlightElements = [];
        this.update(start, end||start.copy());
    };

    // returns whether a position is contained within this range
    contains(position){
        return Position.greaterThan(position, this.start) && Position.lessThan(position, this.end);
    };

    getSelectionLength(){
        if(this.start.line === this.end.line){ return this.end.col - this.start.col; }
        return this.end.getDocPosition() - this.start.getDocPosition();
    };

    // changes the start and endpoints of this selection range so a new one doesn't need to be created
    update(start=null, end=null){
        if(start === null || end === null){
            if(start === null){ start = this.start; }
            if(end   === null){ end = this.end; }

            if(Position.greaterThan(start, end)){
                this.start = end;
                this.end = start;
                this._rightFacing = !this._rightFacing;
            }else{
                this.start = start;
                this.end = end;
            }
        }else{
            if(Position.greaterThan(start, end)){
                this.start = end;
                this.end = start;
                this._rightFacing = false;
            }else{
                this.start = start;
                this.end = end;
                this._rightFacing = true;
            }
        }

        this._empty = Position.equals(this.start, this.end);
        this._rendered = false;
    };

    render(force){
        if(this._rendered && !force){
            for(const e of this._highlightElements){ e.resetAnimation(); }
            return;
        }
        
        this._rendered = true;

        for(const e of this._highlightElements){ e.remove(); }
        this._highlightElements = [];

        const ranges = this.getPerLineSelectionRanges();

        let normalRanges;
        if(this._rightFacing){
            normalRanges = ranges.slice(0, -1);
            const lastLine = ranges[ranges.length-1];
            this._highlightElements.push(new SelectionRangeHighlight(this._editor.lines[lastLine.start.line], lastLine.start.col, lastLine.end.col, 'right'));
        }else{
            normalRanges = ranges.slice(1);
            this._highlightElements.push(new SelectionRangeHighlight(this._editor.lines[ranges[0].start.line], ranges[0].start.col, ranges[0].end.col, 'left'));
        }

        for(const range of normalRanges){
            const highlightElement = new SelectionRangeHighlight(this._editor.lines[range.start.line], range.start.col, range.end.col, null);
            this._highlightElements.push(highlightElement);
        }
    };

    remove(){
        for(const e of this._highlightElements){ e.remove(); }
        this._highlightElements = [];
        this._rendered = false;
    };

    getPerLineSelectionRanges(){
        if(this.start.line === this.end.line){ return [this]; }

        const firstLine = this._editor.range(this.start, this._editor.position(this.start.line, this._editor.lines[this.start.line].length));
        const lastLine = this._editor.range(this._editor.position(this.end.line, 0), this.end);

        const subLineCount = this.end.line - this.start.line - 1;
        if(!subLineCount){ return [firstLine, lastLine]; }

        return [
            firstLine,
            ...Array.from(new Array(subLineCount), (_, i) => {
                const lineIndex = this.start.line+i+1;
                return this._editor.range(this._editor.position(lineIndex, 0), this._editor.position(lineIndex, this._editor.lines[lineIndex].length))
            }),
            lastLine
        ];
    };

    get isRightFacing(){
        return this._rightFacing;
    };

    get isLeftFacing(){
        return !this._rightFacing;
    };

    get isEmpty(){
        return this._empty;
    };

    get head(){
        return this._rightFacing ? this.end : this.start;
    };

    set head(position){
        if(this._rightFacing){ this.update(null, position); }
        else{ this.update(position, null); }
        return position;
    };

    get tail(){
        return this._rightFacing ? this.start : this.end;
    };

    set tail(position){
        if(this._rightFacing){ this.update(position, null); }
        else{ this.update(null, position); }
        return position;
    };
};