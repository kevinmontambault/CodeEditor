import AddStyle from '../__common__/Style.js';

import CodeLine from './CodeLine.js';
import Position from './Position.js';

AddStyle(/*css*/`
    .code-area{
        display: flex;
        position: absolute;
        inset: 0;
        overflow: hidden;
    }

    .code-area .table-container{
        position: relative;
        overflow: hidden;
        flex: 1;
    }

    .code-area .row-window{
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        pointer-events: all;
    }

    .code-area .scroll-gutter{
        position: relative;
        width: 10px;
        user-select: none;
        transition: width .08s;
        pointer-events: all;
        cursor: pointer;
    }

    .code-area .scroll-gutter.hovered, .code-area .scroll-gutter.dragging{
        width: 17px;
    }

    .code-area .scroll-handle-container{
        position: absolute;
        height: 100%;
        width: 100%;
    }
    
    .code-area .scroll-handle{
        background-color: #8C6BC8;
        position: absolute;
        inset: 2px;
        border-radius: 10px;
    }

    .code-area .scroll-gutter.dragging .scroll-handle{
        background-color: #8C6BC8;
    }
`);

function adoptRow(table, row){
    row.style.height = `${table._lineHeight}px`;
    if(row.parentArea && row.parentArea !== table){ row.parentArea.removeRows(newRows); }
    row.parentArea = table;
};

function updateIndexes(table){
    if(table._indexesValid){ return; }
    for(let i=table._lines.length-1; i>=0; i--){ table._lines[i].index = i; }
    table._indexesValid = true;
};

function updateGutterWidth(table){
    table._lineNumberGutterWidth = Math.max(1, Math.ceil(Math.log10(table._lines.length)))*table._fontWidth + 6;
    table.style.setProperty('--line-number-gutter-width', `${table._lineNumberGutterWidth}px`);
};

function reload(table, forceReloadRows=false){
    table._forceReloadRows = table._forceReloadRows || forceReloadRows;

    if(table._queuedReload){ return table._queuedReload; }
    let resolver;
    table._queuedReload = new Promise(resolve => resolver=resolve);

    requestAnimationFrame(() => {
        const oldState = table._renderedState;
        
        const newState = table._queuedState;
        newState.parentHeight       = table._tableContainer.offsetHeight;
        newState.rowCount           = table._lines.length;
        newState.scrollHandleHeight = Math.max(50, Math.min(1, newState.parentHeight/table._lineHeight/newState.rowCount) * newState.parentHeight);
        newState.scrollPosition     = Math.max(0, Math.min(newState.rowCount*table._lineHeight - newState.parentHeight, newState.scrollPosition));

        table._scrollHandle.style.height = `${newState.scrollHandleHeight}px`;
        table._rowWindow.style.transform = `translateY(-${newState.scrollPosition%table._lineHeight}px)`;
        table._scrollHandle.style.top    = `${(newState.scrollTarget/(newState.rowCount*table._lineHeight-newState.parentHeight)) * (newState.parentHeight-newState.scrollHandleHeight)}px`;

        newState.rowStart = Math.max(Math.floor(newState.scrollPosition / table._lineHeight), 0);
        newState.rowEnd   = Math.min(Math.ceil((newState.scrollPosition+newState.parentHeight) / table._lineHeight), newState.rowCount);

        if(forceReloadRows){
            while(table._rowWindow.firstChild){ table._rowWindow.removeChild(table._rowWindow.firstChild); }
            for(let i=newState.rowStart; i<newState.rowEnd; i++){ table._rowWindow.appendChild(table._lines[i]); }
        }

        else if(newState.rowStart !== oldState.rowStart || newState.rowEnd !== oldState.rowEnd){
            if((newState.rowStart>oldState.rowStart && newState.rowStart<oldState.rowEnd) || (newState.rowEnd>oldState.rowStart && newState.rowEnd<oldState.rowEnd)){
                if(newState.rowStart > oldState.rowStart){
                    for(let i=oldState.rowStart; i<newState.rowStart&&i<oldState.rowEnd; i++){
                        table._rowWindow.removeChild(table._lines[i]);
                    }
                }else if(newState.rowStart < oldState.rowStart){
                    const firstChild = table._rowWindow.firstElementChild || null;
                    for(let i=newState.rowStart; i<oldState.rowStart; i++){
                        table._rowWindow.insertBefore(table._lines[i], firstChild);
                    }
                }
                
                if(newState.rowEnd > oldState.rowEnd){
                    for(let i=oldState.rowEnd; i<newState.rowEnd; i++){
                        table._rowWindow.appendChild(table._lines[i]);
                    }
                }else if(newState.rowEnd < oldState.rowEnd){
                    for(let i=Math.max(newState.rowEnd, oldState.rowStart); i<oldState.rowEnd; i++){
                        table._rowWindow.removeChild(table._lines[i]);
                    }
                }
            }else{
                while(table._rowWindow.firstChild){ table._rowWindow.removeChild(table._rowWindow.firstChild); }
                for(let i=newState.rowStart; i<newState.rowEnd; i++){ table._rowWindow.appendChild(table._lines[i]); }
            }
        }

        Object.assign(table._renderedState, newState);

        table._forceReloadRows = false;
        table._queuedReload = null;

        table.dispatchEvent(Object.assign(new Event('reload'), {state:structuredClone(newState)}));
        resolver();
    });
};

export default class CodeArea extends HTMLElement{
    constructor(){
        super();

        this.classList.add('code-area');

        this.innerHTML = /*html*/`
            <div class="table-container">
                <div class="row-window"></div>
            </div>

            <div class="scroll-gutter">
                <div class="scroll-handle-container">
                    <div class="scroll-handle"></div>
                </div>
            </div>
        `;

        this._lineNumberGutterWidth = 0;
        this._fontFamily = null;
        this._fontSize   = 0;
        this._fontWidth  = 0;
        this._lineHeight = 0;
        
        this._rowWindow      = this.querySelector('.row-window');
        this._scrollHandle   = this.querySelector('.scroll-handle');
        this._scrollGutter   = this.querySelector('.scroll-gutter');
        this._tableContainer = this.querySelector('.table-container');
        
        this._renderedState = {rowCount:0, parentHeight:0, rowStart:0, rowEnd:0, scrollPosition:0, scrollTarget:0, scrollHandleHeight:0};
        this._queuedState = Object.assign({}, this._renderedState);

        this._scrollLoop = null;
        
        this._lines = [];
        this._indexesValid = true;
        this._queuedReload = null;
        this._forceReloadRows = false;
        
        // scrolling with wheel
        this.addEventListener('wheel', e => this.scrollTo(this._queuedState.scrollTarget+e.deltaY));
        
        // scrolling by dragging scroll bar
        const scrollHandleContainer = this.querySelector('.scroll-handle-container');
        this._scrollGutter.addEventListener('pointerdown', e => {
            if(e.button !== 0){ return; }

            this._scrollGutter.classList.add('dragging');
            const startScreenY = e.screenY;
            
            let startScrollY;
            if(e.target === scrollHandleContainer){
                startScrollY = Math.min(this._renderedState.parentHeight - this._renderedState.scrollHandleHeight, Math.max(0, e.offsetY - this._renderedState.scrollHandleHeight/2));
                this.scrollTo(startScrollY/(this._renderedState.parentHeight - this._renderedState.scrollHandleHeight) * this._renderedState.rowCount*this._lineHeight);
                reload(this);
            }else{
                startScrollY = this._renderedState.scrollTarget / this._renderedState.rowCount / this._lineHeight * (this._renderedState.parentHeight - this._renderedState.scrollHandleHeight);
            }

            const moveHandler = ({screenY}) => {
                const scrollHandleTop = Math.min(this._renderedState.parentHeight - this._renderedState.scrollHandleHeight, Math.max(0, startScrollY+screenY-startScreenY));
                if(this._renderedState.scrollHandleHeight === this._renderedState.parentHeight){ this.scrollTo(0); }
                else{ this.scrollTo((this._renderedState.rowCount*this._lineHeight-this._renderedState.parentHeight) * scrollHandleTop/(this._renderedState.parentHeight-this._renderedState.scrollHandleHeight)); }
                reload(this);
            };

            window.addEventListener('pointerup', () => {
                window.removeEventListener('pointermove', moveHandler);
                this._scrollGutter.classList.remove('dragging');
            });

            window.addEventListener('pointermove', moveHandler);
            e.stopImmediatePropagation();
            e.preventDefault();
        });

        let enterTime = 0;
        let leaveTimeout = null;
        this._scrollGutter.addEventListener('pointerenter', () => {
            clearTimeout(leaveTimeout);
            enterTime = performance.now();
            leaveTimeout = null;
            this._scrollGutter.classList.add('hovered');
        });
        
        this._scrollGutter.addEventListener('pointerleave', () => {
            const timeout = performance.now()-enterTime<15 ? 0 : 250;
            leaveTimeout = setTimeout(() => {
                this._scrollGutter.classList.remove('hovered');
                leaveTimeout = null;
            }, timeout);
        });

        // refresh the row visibility whenever the container changes size
        (new ResizeObserver(() => reload(this))).observe(this._tableContainer);
    };

    set lineHeight(height){
        this._lineHeight = height;

        for(const row of this._lines){ row.style.height = `${height}px`; }
        reload(this, true);
        return height;
    };

    get lineHeight(){
        return this._lineHeight;
    };

    changeFontSize(delta){
        return this.setFont(null, Math.max(1, this._fontSize + delta));
    };

    setFont(font, size){
        if(!font){ font = this._fontFamily; }
        if(!size){ size = this._fontSize; }

        this.style.setProperty('--line-font-family', font);
        this.style.setProperty('--line-font-size', `${size}px`);
        this.style.setProperty('--line-highlight-radius', `${size*.2}px`);
        
        // canvas used to measure text
        const textRuler = document.createElement('canvas');
        const context = textRuler.getContext('2d');
        context.font = `${size}px ${font}`;
        this._fontWidth = context.measureText('M').width;
        this.style.setProperty('--line-font-width', `${this._fontWidth}px`);
        
        this._fontSize = size;
        this._fontFamily = font;
        
        updateGutterWidth(this);
        this.lineHeight = size * 1.2;

        // this.select(this.ranges);
        return true;
    };

    setText(newText){
        this.clear();

        const textLines = newText.split(/\r?\n/);

        let prevLine = null;
        for(const line of textLines){
            const codeLine = new CodeLine(line, prevLine);
            prevLine = codeLine;
            adoptRow(this, codeLine);
            this._lines.push(codeLine);
        }

        this._indexesValid = false;
        updateIndexes(this);
        updateGutterWidth(this);

        reload(this, true);
    };

    deleteText(rangeOrRanges){
        const ranges = Array.isArray(rangeOrRanges) ? rangeOrRanges.map(range => range.toRightFacing()) : [rangeOrRanges.toRightFacing()];
        ranges.sort((a, b) => Position.greaterThan(a.tail, b.tail) ? -1 : 1);

        for(const range of ranges){
            if(range.head.line === range.tail.line){
                const line = this.getLine(range.tail.line);
                line.setText(line.text.slice(0, range.tail.col) + line.text.slice(range.head.col, line.length));
            }

            else{
                const firstLine = this.getLine(range.tail.line);
                const lastLine = this.getLine(range.head.line);
                firstLine.setText(firstLine.text.slice(0, range.tail.col) + lastLine.text.slice(range.head.col, lastLine.length));

                this.removeRows(range.tail.line+1, range.head.line);
            }
        }
    };

    insertText(newText, position){

    };

    // Inserts multiple rows at a given index
    insertRows(newRows, index=-1){
        if(index < 0){ index = this._lines.length + index + 1; }
        for(const row of newRows){ adoptRow(this, row); }

        if(index === this._lines.length){
            for(let i=0; i<newRows.length; i++){ newRows[i].index = index + i; }
            this._lines.push(...newRows);
        }else{
            this._indexesValid = false;
            this._lines.splice(index, 0, ...newRows);
        }

        reload(this, true);
    };

    // Inserts a single row into the table
    insertRow(newRow, index=-1){
        if(newRow.parentArea){ newRow.parentArea.removeRow(newRow); }
        if(index < 0){ index = this._lines.length + index + 1; }

        if(index === this._lines.length){
            newRow.index = index;
            this._lines.push(newRow);
        }else{
            this._indexesValid = false;
            this._lines.splice(index, 0, newRow);
        }

        adoptRow(this, newRow);

        if(index <= this._renderedState.rowEnd){ reload(this, true); }
    };

    // Removes a single row from the table
    removeRow(row){
        if(row.parentArea !== this){ return false; }

        updateIndexes(this);

        const removingIndex = row.index;
        this._lines.splice(removingIndex, 1);
        delete row.parentArea;

        this._indexesValid = removingIndex === this._lines.length;

        if(removingIndex <= this._renderedState.rowEnd){ reload(this); }
        return true;
    };

    // Removes a list of rows from the table
    removeRows(start, end){
        const prevLine = this.getLine(start);

        if(end < this._lines.length){
            const nextLine = this.getLine(end+1);
            prevLine.nextLine = nextLine
            nextLine.prevLine = prevLine;
            nextLine.invalidateState();
        }else{
            prevLine.nextLine = null;
        }

        for(let i=end; i>=start; i--){
            const line = this.getLine(i);
            delete line.parentArea;
        }

        this._lines.splice(start, end-start+1);

        this._indexesValid = false;
        reload(this, true);
    };
    
    // removes all lines from the code area
    clear(){
        const removedLines = this._lines.splice(0, this._lines.length);
        for(const row of removedLines){ delete row.parentArea; }
        this._indexesValid = true;

        reload(this);
        return removedLines;
    };

    // returns the index of a row within the table
    // if the row is not in the table, -1 is returned
    getLineIndex(line){
        updateIndexes(this);
        return line.index;
    };

    // Returns the row at a given index
    getLine(index){
        if(index < 0){ index = this._lines.length + index + 1; }
        if(index < 0 || index >= this._lines.length){ return null; }
        return this._lines[index];
    };

    // returns the row at a specific y offset relative to the window
    getLineAt(y){
        return this._lines[Math.floor((y + this._renderedState.scrollPosition) / this._lineHeight)] || null;
    };

    // returns the line and column number of a given x/y position relative to the code window
    getPositionAt(x, y){
        return new Position(Math.floor((y + this._renderedState.scrollPosition) / this._lineHeight), Math.floor((x - this._lineNumberGutterWidth) / this._fontWidth));
    };

    // scrolls to a position on the table
    scrollTo(y){
        this._queuedState.scrollTarget = Math.min(Math.max(0, y), Math.max(0, this._lines.length*this._lineHeight - this._tableContainer.offsetHeight));

        if(!this._scrollLoop){
            this._scrollLoop = requestAnimationFrame(function scrollLoop(){
                const delta = this._queuedState.scrollTarget - this._queuedState.scrollPosition;

                if(Math.abs(delta) < 1){
                    this._queuedState.scrollPosition = this._queuedState.scrollTarget;
                    this._scrollLoop = null;
                }else{
                    this._queuedState.scrollPosition += delta / 3
                    this._scrollLoop = requestAnimationFrame(scrollLoop.bind(this));
                    reload(this);
                }
            }.bind(this));
        }
    };

    get fontWidth(){
        return this._fontWidth;
    };
};
customElements.define('code-area', CodeArea);