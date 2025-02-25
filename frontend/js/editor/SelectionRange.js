import AddStyle from '../__common__/Style.js';
import CodeLine from './CodeLine.js';
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
    constructor(line, head, tail, cursor=false){
        super();

        this.classList.add('selection-range-highlight');

        if(head < tail){
            this.style.left = `${Math.min(line.length, head) * line.charWidth}px`;
            this.style.width = `${(Math.min(line.length, tail)-head) * line.charWidth}px`;
            this.classList.toggle('cursor-left', cursor);
        }else{
            this.style.left = `${Math.min(line.length, tail) * line.charWidth}px`;
            this.style.width = `${(Math.min(line.length, head)-tail) * line.charWidth}px`;
            this.classList.toggle('cursor-right', cursor);
        }

        line.insertSelectionHighlight(this);
    };
};
customElements.define('selection-range-highlight', SelectionRangeHighlight);

export default class SelectionRange{
    static normalizeRanges(ranges){
        return ranges.map(range => range.normal());
    };

    static mergeRanges(ranges){
        for(let i=ranges.length-1; i>=0; i--){

            // check if range head intersects with any other ranges
            for(let j=ranges.length-1; j>=0; j--){
                if(i === j){ continue; }

                if(ranges[j].merge(ranges[i])){
                    ranges.splice(i, 1);
                    break;
                }
            }
        }

        return ranges;
    };

    constructor(head, tail=null){
        this.head = head;
        this.tail = tail || this.head;

        this.empty = Position.equals(this.head, this.tail);

        this.highlights = [];
    };

    // returns whether a position is contained within this range
    contains(position){
        if(this.isRightFacing()){ return Position.lessThan(position, this.head) && Position.greaterThan(position, this.tail); }
        else{ return Position.lessThan(position, this.tail) && Position.greaterThan(position, this.head); }
    };

    // returns a new range that is right-pointing
    normal(){
        return this.toRightFacing();
    };

    toRightFacing(){
        return this.isRightFacing() ? this : new SelectionRange(this.tail, this.head);
    };

    toLeftFacing(){
        return this.isLeftFacing() ? this : new SelectionRange(this.tail, this.head);
    };

    // merge this range and a given range into a single range
    // returns false if such an operation is not possible
    merge(range){
        if(range.empty){ return Position.equals(this.tail, range.head) || Position.equals(this.head, range.head)}
        if(!this.contains(range.head)){ return false; }

        if(this.isRightFacing()){
            if(Position.greaterThan(this.tail, range.tail)){ this.tail = range.tail; }
            else if(Position.lessThan(this.head, range.tail)){ this.head = range.tail; }
        }else{
            if(Position.greaterThan(this.head, range.tail)){ this.head = range.tail; }
            else if(Position.lessThan(this.tail, range.tail)){ this.tail = range.tail; }
        }

        return true;
    };

    isLeftFacing(){
        return Position.lessThan(this.head, this.tail);
    };
    
    isRightFacing(){
        return Position.greaterThan(this.head, this.tail);
    };

    min(){
        return this.isRightFacing() ? this.tail : this.head;
    };
    
    max(){
        return this.isLeftFacing() ? this.tail : this.head;
    };

    getPerLineRanges(lines){
        if(this.head.line === this.tail.line){
            if(this.isRightFacing()){ return [{line:this.head.line, start:this.tail.col, end:this.head.col}]; }
            return [{line:this.head.line, start:this.head.col, end:this.tail.col}];
        }

        const lineRanges = [];
        if(this.isRightFacing()){
            lineRanges.push({line:this.tail.line, start:this.tail.col, end:-1});

            for(let lineIndex=this.tail.line+1; lineIndex<this.head.line; lineIndex++){
                lineRanges.push({line:lineIndex, start:0, end:-1});
            }

            lineRanges.push({line:this.head.line, start:0, end:this.head.col});
        }

        else{
            lineRanges.push({line:this.head.line, start:this.head.col, end:-1});

            for(let lineIndex=this.head.line+1; lineIndex<this.tail.line; lineIndex++){
                lineRanges.push({line:lineIndex, start:0, end:lines[lineIndex].length});
            }

            lineRanges.push({line:this.col.line, start:0, end:this.tail.col});
        }

        return lineRanges;
    };

    apply(lines){
        this.clear();

        if(this.head.line === this.tail.line){
            this.highlights.push(new SelectionRangeHighlight(lines[this.head.line], this.head.col, this.tail.col, true));
        }
        
        else{
            if(this.isRightFacing()){
                const startLine = lines[this.tail.line];
                this.highlights.push(new SelectionRangeHighlight(startLine, this.tail.col, startLine.length, false));

                for(let lineIndex=this.tail.line+1; lineIndex<this.head.line; lineIndex++){
                    this.highlights.push(new SelectionRangeHighlight(lines[lineIndex], 0, lines[lineIndex].length));
                }

                this.highlights.push(new SelectionRangeHighlight(lines[this.head.line], this.head.col, 0, true));
            }

            else{
                const startLine = lines[this.head.line];
                this.highlights.push(new SelectionRangeHighlight(startLine, this.head.col, startLine.length, true));

                for(let lineIndex=this.head.line+1; lineIndex<this.tail.line; lineIndex++){
                    this.highlights.push(new SelectionRangeHighlight(lines[lineIndex], 0, lines[lineIndex].length));
                }

                this.highlights.push(new SelectionRangeHighlight(lines[this.tail.line], this.tail.col, 0, false));
            }
        }
    };

    clear(){
        for(const highlight of this.highlights){ highlight.remove(); }
        this.highlights = [];
    };
};