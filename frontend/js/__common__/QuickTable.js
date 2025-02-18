import AddStyle from './Style.js';

AddStyle(/*css*/`
    .quick-table{
        display:grid;
        position:absolute;
        inset:0;
        overflow:hidden;
        grid-template-columns:1fr auto;
        grid-template-rows:auto 1fr;
    }

    .quick-table > .table-header{
        display:grid;
        user-select:none;
    }

    .quick-table > .table-header > div{
        position:relative;
        display:flex;
        font-size:12px;
        color:white;
        padding:0 4px;
        align-items:center;
        justify-content:center;
    }

    .quick-table > .table-header > div[sort-default]:hover, .quick-table > .table-header > div[sortable]:hover{
        background-color:darkgrey;
        cursor:pointer;
    }

    .quick-table > .table-header > *::after{
        border-color:pink;
        border:solid orange;
        border-width:0 3px 3px 0;
        padding:3px;
        margin:3px 6px;
        visibility:hidden;
        content:' ';
    }

    .quick-table .table-header > *[sort-direction="1"]::after{
        transform:matrix(-0.71, -0.71, 0.71, -0.71, 0, 1);
        -webkit-transform:matrix(-0.71, -0.71, 0.71, -0.71, 0, 1);
        visibility:visible;
    }

    .quick-table .table-header > *[sort-direction="-1"]::after{
        transform:matrix(0.71, 0.71, -0.71, 0.71, 0, -2);
        -webkit-transform:matrix(0.71, 0.71, -0.71, 0.71, 0, -2);
        visibility:visible;
    }

    .quick-table .table-container{
        position:relative;
        overflow:hidden;
    }

    .quick-table .row-window{
        position:absolute;
        width:100%;
        height:100%;
        top:0;
    }

    .quick-table .scroll-gutter{
        position:relative;
        width:10px;
        user-select:none;
        transition:width .08s;
    }

    .quick-table .scroll-gutter.hovered, .quick-table .scroll-gutter.dragging{
        width:17px;
    }

    .quick-table .scroll-handle-container{
        position:absolute;
        height:100%;
        width:100%;
    }
    
    .quick-table .scroll-handle{
        background-color:orange;
        position:absolute;
        inset:2px;
        border-radius:10px;
    }

    .quick-table .scroll-gutter.dragging .scroll-handle{
        background-color:orange;
    }
`);

function initialize(table){
    table.classList.add('quick-table');

    table.innerHTML = /*html*/`
        <div class="table-header unselectable"></div>
        <dummy></dummy>

        <div class="table-container">
            <div class="row-window"></div>
        </div>

        <div class="scroll-gutter">
            <div class="scroll-handle-container">
                <div class="scroll-handle"></div>
            </div>
        </div>
    `;

    table._rowHeight = table.hasAttribute('row-height') ? parseFloat(table.getAttribute('row-height')) : 22;
    
    // enable sorting by clicking column headers
    // TODO: instead of adding the listener on the whole header, only add it to sortable column headers
    table._header = table.querySelector('.table-header');
    table._header.addEventListener('click', ({target}) => {
        while(target.parentNode !== table._header){ target = target.parentNode; }

        // if the clicked header is sortable or has a default sort direction
        if(target.hasAttribute('sortable') || target.hasAttribute('sort-default')){
            const columnIndex = Array.from(table._header.children).indexOf(target);

            let sortDirection;
            if(target.hasAttribute('sort-direction')){    sortDirection = -parseInt(target.getAttribute('sort-direction')); }
            else if(target.hasAttribute('sort-default')){ sortDirection =  parseInt(target.getAttribute('sort-default'));   }
            else{ sortDirection = -1; }

            table.sort(columnIndex, sortDirection, true);
            target.setAttribute('sort-direction', sortDirection);
        }
    });

    table._rowWindow      = table.querySelector('.row-window');
    table._scrollHandle   = table.querySelector('.scroll-handle');
    table._scrollGutter   = table.querySelector('.scroll-gutter');
    table._tableContainer = table.querySelector('.table-container');
    
    table._renderedState = {rowCount:0, parentHeight:0, rowStart:0, rowEnd:0, scrollPosition:0, scrollTarget:0, scrollHandleHeight:0};
    table._queuedState = Object.assign({}, table._renderedState);

    table._scrollLoop = null;
    
    table._rows = [];
    table._indexesValid = true;
    table._queuedReload = null;
    table._forceReloadRows = false;
    table._sortState = {index:-1, direction:0, compare:() => 0};
    
    // scrolling with wheel
    table.addEventListener('wheel', e => table.scrollTo(table._queuedState.scrollTarget+e.deltaY));
    
    // scrolling by dragging scroll bar
    const scrollHandleContainer = table.querySelector('.scroll-handle-container');
    if(table.hasAttribute('noscroll')){
        table._scrollGutter.style.display = 'none';
    }else{
        table._scrollGutter.addEventListener('pointerdown', e => {
            if(e.button !== 0){ return; }

            table._scrollGutter.classList.add('dragging');
            const startScreenY = e.screenY;
            
            let startScrollY;
            if(e.target === scrollHandleContainer){
                startScrollY = Math.min(table._renderedState.parentHeight - table._renderedState.scrollHandleHeight, Math.max(0, e.offsetY - table._renderedState.scrollHandleHeight/2));
                table.scrollTo(startScrollY/(table._renderedState.parentHeight - table._renderedState.scrollHandleHeight) * table._renderedState.rowCount*table._rowHeight);
                reload(table);
            }else{
                startScrollY = table._renderedState.scrollTarget / table._renderedState.rowCount / table._rowHeight * (table._renderedState.parentHeight - table._renderedState.scrollHandleHeight);
            }

            const moveHandler = ({screenY}) => {
                const scrollHandleTop = Math.min(table._renderedState.parentHeight - table._renderedState.scrollHandleHeight, Math.max(0, startScrollY+screenY-startScreenY));
                if(table._renderedState.scrollHandleHeight === table._renderedState.parentHeight){ table.scrollTo(0); }
                else{ table.scrollTo((table._renderedState.rowCount*table._rowHeight-table._renderedState.parentHeight) * scrollHandleTop/(table._renderedState.parentHeight-table._renderedState.scrollHandleHeight)); }
                reload(table);
            };

            window.addEventListener('pointerup', () => {
                window.removeEventListener('pointermove', moveHandler);
                table._scrollGutter.classList.remove('dragging');
            });

            window.addEventListener('pointermove', moveHandler);
        });

        let enterTime = 0;
        let leaveTimeout = null;
        table._scrollGutter.addEventListener('pointerenter', () => {
            clearTimeout(leaveTimeout);
            enterTime = performance.now();
            leaveTimeout = null;
            table._scrollGutter.classList.add('hovered');
        });
        
        table._scrollGutter.addEventListener('pointerleave', () => {
            const timeout = performance.now()-enterTime<15 ? 0 : 250;
            leaveTimeout = setTimeout(() => {
                table._scrollGutter.classList.remove('hovered');
                leaveTimeout = null;
            }, timeout);
        });
    }

    // refresh the row visibility whenever the container changes size
    (new ResizeObserver(() => {
        reload(table);
        table.dispatchEvent(new Event('resize'));
    })).observe(table._tableContainer);
};

function adoptRow(table, row){
    row.style.height = `${table._rowHeight}px`;
    if(row.parentTable && row.parentTable !== table){ row.parentTable.removeRows(newRows); }
    row.parentTable = table;
};

function updateIndexes(table){
    if(table._indexesValid){ return; }
    for(let i=table._rows.length-1; i>=0; i--){ table._rows[i].index = i; }
    table._indexesValid = true;
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
        newState.rowCount           = table._rows.length;
        newState.scrollHandleHeight = Math.max(50, Math.min(1, newState.parentHeight/table._rowHeight/newState.rowCount) * newState.parentHeight);
        newState.scrollPosition     = Math.max(0, Math.min(newState.rowCount*table._rowHeight - newState.parentHeight, newState.scrollPosition));

        table._scrollHandle.style.height = `${newState.scrollHandleHeight}px`;
        table._rowWindow.style.transform = `translateY(-${newState.scrollPosition%table._rowHeight}px)`;
        table._scrollHandle.style.top    = `${(newState.scrollTarget/(newState.rowCount*table._rowHeight-newState.parentHeight)) * (newState.parentHeight-newState.scrollHandleHeight)}px`;

        newState.rowStart = Math.max(Math.floor(newState.scrollPosition / table._rowHeight), 0);
        newState.rowEnd   = Math.min(Math.ceil((newState.scrollPosition+newState.parentHeight) / table._rowHeight), newState.rowCount);

        if(forceReloadRows){
            while(table._rowWindow.firstChild){ table._rowWindow.removeChild(table._rowWindow.firstChild); }
            for(let i=newState.rowStart; i<newState.rowEnd; i++){ table._rowWindow.appendChild(table._rows[i]); }
        }

        else if(newState.rowStart !== oldState.rowStart || newState.rowEnd !== oldState.rowEnd){
            if((newState.rowStart>oldState.rowStart && newState.rowStart<oldState.rowEnd) || (newState.rowEnd>oldState.rowStart && newState.rowEnd<oldState.rowEnd)){
                if(newState.rowStart > oldState.rowStart){
                    for(let i=oldState.rowStart; i<newState.rowStart&&i<oldState.rowEnd; i++){
                        table._rowWindow.removeChild(table._rows[i]);
                    }
                }else if(newState.rowStart < oldState.rowStart){
                    const firstChild = table._rowWindow.firstElementChild || null;
                    for(let i=newState.rowStart; i<oldState.rowStart; i++){
                        table._rowWindow.insertBefore(table._rows[i], firstChild);
                    }
                }
                
                if(newState.rowEnd > oldState.rowEnd){
                    for(let i=oldState.rowEnd; i<newState.rowEnd; i++){
                        table._rowWindow.appendChild(table._rows[i]);
                    }
                }else if(newState.rowEnd < oldState.rowEnd){
                    for(let i=Math.max(newState.rowEnd, oldState.rowStart); i<oldState.rowEnd; i++){
                        table._rowWindow.removeChild(table._rows[i]);
                    }
                }
            }else{
                while(table._rowWindow.firstChild){ table._rowWindow.removeChild(table._rowWindow.firstChild); }
                for(let i=newState.rowStart; i<newState.rowEnd; i++){ table._rowWindow.appendChild(table._rows[i]); }
            }
        }

        Object.assign(table._renderedState, newState);

        table._forceReloadRows = false;
        table._queuedReload = null;

        table.dispatchEvent(Object.assign(new Event('reload'), {state:structuredClone(newState)}));
        resolver();
    });
};

export default class QuickTable extends HTMLElement{
    constructor(){
        super();
        initialize(this);
    };

    setRowHeight(height){
        this._rowHeight = height;

        for(const row of this._rows){ row.style.height = `${height}px`; }
        reload(this, true);
    };

    // Finds the index that a given row would reside at within the table if inserted with the current sort method
    getInsertionIndex(row, lowerBound=0, upperBound=-1){
        if(upperBound < 0){ upperBound = this._rows.length + upperBound + 1; }
        if(lowerBound < 0){ lowerBound = this._rows.length + lowerBound + 1; }
        
        if(!this._rows.length){ return 0; }

        let left  = lowerBound;
        let right = upperBound;
        let mid, c;
        while(left <= right){
            mid = (left+right) >> 1;
            c = this._sortState.compare(this._rows[mid], row);

            if(c===0 || c===-1){ left = mid + 1; }
            else{ right = mid - 1; }
        }

        if(v < 1){ mid = Math.min(mid+1, this._rows.length); }
        return mid;
    };

    // Discards all current rows and replaces them with a new array of rows
    setRows(newRows){
        for(const row of newRows){ adoptRow(this, row); }

        this._indexesValid = false;
        this._rows = [...newRows];
        updateIndexes(this);

        reload(this, true);
        this.dispatchEvent(new Event('change'));
    };

    // Inserts multiple rows at a given index
    insertRows(newRows, index=-1){
        if(index < 0){ index = this._rows.length + index + 1; }
        for(const row of newRows){ adoptRow(this, row); }

        if(index === this._rows.length){
            for(let i=0; i<newRows.length; i++){ newRows[i].index = index + i; }
            this._rows.push(...newRows);
        }else{
            this._indexesValid = false;
            this._rows.splice(index, 0, ...newRows);
        }

        reload(this, true);
        this.dispatchEvent(new Event('change'));
    };

    // Inserts a single row into the table
    insertRow(newRow, index=-1){
        if(newRow.parentTable){ newRow.parentTable.removeRow(newRow); }

        if(index === 'sorted'){ index = this.getInsertionIndex(newRow); }
        else if(index < 0){ index = this._rows.length + index + 1; }

        if(index === this._rows.length){
            newRow.index = index;
            this.rows.push(newRow);
        }else{
            this._indexesValid = false;
            this._rows.splice(index, 0, newRow);
        }

        adoptRow(this, newRow);

        if(index <= this._renderedState.rowEnd){ reload(this, true); }

        this.dispatchEvent(new Event('change'));
    };

    // Removes a single row from the table
    removeRow(row){
        if(row.parentTable !== this){ return false; }

        updateIndexes(this);

        const removingIndex = row.index;
        this._rows.splice(removingIndex, 1);
        delete row.parentTable;

        this._indexesValid = removingIndex === this._rows.length;

        if(removingIndex <= this._renderedState.rowEnd){ reload(this); }

        this.dispatchEvent(new Event('change'));
        return true;
    };

    // Removes a list of rows from the table
    removeRows(removingRows){
        removingRows = removingRows.filter(row => row.parentTable === this);
        if(!removingRows.length){ return []; }

        updateIndexes(this);

        removingRows.sort((a, b) => a.index>b.index ? -1 : 1);

        for(const row of removingRows){
            this._rows.splice(row.index, 1);
            delete row.parentTable;
        }
        
        this._indexesValid = false;
        this.dispatchEvent(new Event('change'));
        reload(this);
        
        return removingRows;
    };
    
    // Removes all rows from the table
    empty(){
        const removedRows = this._rows.splice(0, this._rows.length);
        for(const row of removedRows){ delete row.parentTable; }
        this._indexesValid = true;

        reload(this);
        return removedRows;
    };

    // Returns the index of a row within the table
    // If the row is not in the table, -1 is returned
    getRowIndex(row){
        if(row.parentTable !== this){ return -1; }
        updateIndexes(this);
        return row.index;
    };

    // Returns the row at a given index
    getRow(index){
        if(index < 0){ index = this._rows.length + index + 1; }
        if(index < 0 || index >= this._rows.length){ return null; }
        return this._rows[index];
    };

    // returns the row at a specific y offset relative to the window
    getRowAt(y){
        return this._rows[Math.floor((y + this._renderedState.scrollPosition) / this._rowHeight)] || null;
    };

    // Sorts the table based on the text within a column header
    sortByHeaderTitle(title, direction=0){
        const index = Array.from(this._header.children).findIndex(element => element.innerText === title);
        if(index === -1){ return false; }

        const header = this._header.children[index];
        if(!header.hasAttribute('sortable') && !header.hasAttribute('sort-default')){ return false; }

        let sortDirection;
        if(direction){ sortDirection = direction; }
        else if(header.hasAttribute('sort-direction')){    sortDirection = -parseInt(header.getAttribute('sort-direction')); }
        else if(header.hasAttribute('sort-default')){ sortDirection =  parseInt(header.getAttribute('sort-default'));   }
        else{ sortDirection = -1; }

        this.sort(index, sortDirection, true);
        header.setAttribute('sort-direction', sortDirection);

        return true;
    };

    sort(index, direction=1, directionToggle=false){
        if(directionToggle && index===this._sortState.index){ direction = -this._sortState.direction; }
        
        this._sortState.index = index;
        this._sortState.direction = direction;
        this._sortState.compare = (a, b) => {
            const aValue = a.getColumnData?.(index) || 0;
            const bValue = b.getColumnData?.(index) || 0;
            return (aValue<bValue ? -1 : bValue<aValue ? 1 : 0) * direction;
        };

        this._rows.sort(this._sortState.compare);
        this._indexesValid = false;
        
        reload(this, true);
        this.dispatchEvent(Object.assign(new Event('sort'), {index, direction}));
        return this._sortState.direction;
    };

    // Resorts the table based on the last used-sort
    resort(defaultIndex=0, defaultDirection=1, directionToggle=false){
        if(!this._sortState.index){ Object.assign(this._sortState, {index:defaultIndex, direction:defaultDirection}); }
        this.sort(this._sortState.index, this._sortState.direction, directionToggle);
        reload(this, true);
    };

    // Scrolls to a position on the table
    scrollTo(y){
        this._queuedState.scrollTarget = Math.min(Math.max(0, y), Math.max(0, this._rows.length*this._rowHeight - this._tableContainer.offsetHeight));

        if(!this._scrollLoop){
            this._scrollLoop = requestAnimationFrame(function scrollLoop(){
                const delta = this._queuedState.scrollTarget - this._queuedState.scrollPosition;

                if(Math.abs(delta) < 1){
                    this._queuedState.scrollPosition = this._queuedState.scrollTarget;
                    this._scrollLoop = null;
                }else{
                    this._queuedState.scrollPosition += delta / 3
                    this._scrollLoop = requestAnimationFrame(scrollLoop.bind(this));
                    this.dispatchEvent(Object.assign(new Event('scroll'), ));
                    reload(this);
                }
            }.bind(this));
        }
    };
};
customElements.define('quick-table', QuickTable);