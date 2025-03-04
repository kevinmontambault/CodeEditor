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
    constructor(lineRange, cursor=null){
        super();

        this.classList.add('selection-range-highlight');

        const line = lineRange.getLine();

        this.style.left = `${Math.min(line.length, lineRange.start) * line.charWidth}px`;
        this.style.width = `${(Math.min(line.length, lineRange.end)-lineRange.start) * line.charWidth}px`;

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

class LineRange{
    constructor(editor, line, start, end, includesLineEnd=false){
        this._editor = editor;

        this.line  = line;
        this.start = start;
        this.end   = end;
        this.includesLineEnd = includesLineEnd;
    };

    getLine(){
        return this._editor.lines[this.line];
    };

    toJSON(){
        return JSON.stringify({line:this.line, start:this.start, end:this.end});
    };

    toString(){
        return `${this.line}:${this.start}->${this.end}`;
    };

    get isFullLine(){
        return !this.start && this.getLine().length === this.end;
    };
};

export default class SelectionRange{
    static mergeAndSortRanges(ranges){
        ranges.sort((a, b) => Position.lessThan(a.start, b.start) ? -1 : 1);
        return SelectionRange.mergeSortedRanges(ranges);
    };

    // merges ranges without a sort operation
    static mergeSortedRanges(ranges){
        const kept = [...ranges];
        for(let i=kept.length-1; i>=1; i--){
            if(
                kept[i-1].contains(kept[i].start)               ||
                Position.equals(kept[i].start, kept[i-1].start) ||
                Position.equals(kept[i].end, kept[i-1].end)
            ){
                if(Position.greaterThan(kept[i].end, kept[i-1].end)){
                    if(kept[i]._rightFacing){ kept[i-1].update(null, kept[i].end); }
                    else{ kept[i-1].update(kept[i].end, kept[i-1].start); }
                }
                
                kept.splice(i, 1);
            }
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

        const lineRanges = this.getPerLineSelectionRanges();

        let normalLineRanges;
        if(this._rightFacing){
            normalLineRanges = lineRanges.slice(0, -1);
            this._highlightElements.push(new SelectionRangeHighlight(lineRanges[lineRanges.length-1], 'right'));
        }else{
            normalLineRanges = lineRanges.slice(1);
            this._highlightElements.push(new SelectionRangeHighlight(lineRanges[0], 'left'));
        }

        for(const range of normalLineRanges){
            this._highlightElements.push(new SelectionRangeHighlight(range, null));
        }
    };

    remove(){
        for(const e of this._highlightElements){ e.remove(); }
        this._highlightElements = [];
        this._rendered = false;
    };

    getPerLineSelectionRanges(){
        if(this.start.line === this.end.line){ return [new LineRange(this._editor, this.start.line, this.start.col, this.end.col, false)]; }

        const firstLine = new LineRange(this._editor, this.start.line, this.start.col, this._editor.lines[this.start.line].length, true);
        const lastLine = new LineRange(this._editor, this.end.line, 0, this.end.col, false);

        const subLineCount = this.end.line - this.start.line - 1;
        if(!subLineCount){ return [firstLine, lastLine]; }

        return [
            firstLine,
            ...Array.from(new Array(subLineCount), (_, i) => {
                const lineIndex = this.start.line+i+1;
                return new LineRange(this._editor, lineIndex, 0, this._editor.lines[lineIndex].length, true)
            }),
            lastLine
        ];
    };

    shiftDocPosition(documentPositionDelta){
        return this.setDocPosition(this.start.getDocPosition() + documentPositionDelta);
    };

    setDocPosition(newDocumentPosition){
        const newStart = this.start.setDocPosition(newDocumentPosition);
        if(this._empty){ return this.update(newStart, newStart.copy()); }
        else{ return this.update(newStart, this.end.setDocPosition(newDocumentPosition)); }
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