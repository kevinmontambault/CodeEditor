import AddStyle from '../__common__/Style.js';
import Drive from '../__common__/Drive.js';

import {insertCharacter} from './Commands.js';
import Keybinds from './Keybinds.js';
import CodeLine from './CodeLine.js';
import Position from './Position.js';
import './QuickTable.js';

import * as Shiki from 'shiki';
import SelectionRange from './SelectionRange.js';

AddStyle(/*css*/`
    .editor-context{
        pointer-events: all;
        cursor: text;
    }

    .editor-context .code-area{
        pointer-events: all;
    }

    .editor-context .cursor-area{
        position: absolute;
    }

    .editor-context .cursor{
        border-left-color: white;
        border-width: 2px;
    }

    .editor-context .tab{
        border-left: 1px solid grey;
    }
`);

export default class EditorContext extends HTMLElement{
    static contentCache = new Map();
    static focusedContext = null;
    static theme = 'monokai';
    static spacesPerTab = 4;
    
    constructor(fileName, filePath){
        super();

        this.classList.add('editor-context', 'flex-fill');
        this.toggleAttribute('focusable', true);

        this.innerHTML = /*html*/`
            <quick-table class="code-area"></quick-table>
        `;

        this.table = this.querySelector('.code-area');
        this.filePath = filePath;

        this.keybinds = Keybinds;

        // editor font
        this.font      = null;
        this.fontSize  = 0;
        this.fontWidth = 0;
        this.setFont("'Cascadia Mono', monospace", 14);

        // cursor selections
        this.ranges = [];

        // when the code area is focused, toggle the cursor animation on
        this.addEventListener('focusin', () => {
        });

        // when the element is unfocused, disable the cursor animation
        this.addEventListener('focusout', () => {
        });

        //
        this.addEventListener('pointerdown', downEvent => {
            const position = this.getPositionAt(downEvent.offsetX, downEvent.offsetY);

            const selectedLine = this.lines[position.line];
            if(!selectedLine){ return; }
            
            const newPosition = new SelectionRange(new Position(position.line, Math.min(position.col, selectedLine.length)));

            if(downEvent.ctrlKey){ this.select([...this.ranges, newPosition]); }
            else{ this.select([newPosition]); }
        });

        this.addEventListener('keydown', downEvent => {
            const keyString = [];
            if(downEvent.ctrlKey){ keyString.push('Ctrl'); }
            if(downEvent.altKey){ keyString.push('Alt'); }
            if(downEvent.shiftKey){ keyString.push('Shift'); }
            keyString.push(downEvent.code);
            const shortcutCode = keyString.join('+');

            
            if(this.keybinds[shortcutCode]?.(this)){ return downEvent.preventDefault(); }
            if(downEvent.key.length === 1 && insertCharacter(downEvent.key)(this)){ return downEvent.preventDefault(); }

            console.log(shortcutCode)
        });

        this.reload();
    };

    async reload(){
        if(EditorContext.contentCache.has(this.filePath)){
            this.setText(EditorContext.contentCache.get(this.filePath));
        }else{
            this.classList.add('loading');
            const response = await Drive.readFile(this.filePath);
            this.classList.remove('loading');

            if(response.success){
                EditorContext.contentCache.set(this.filePath, response.text);
                this.setText(response.text);
            }else{
                // errorText.innerText = 'Failed to fetch file';
                // errorText.classList.remove('hidden');
            }
        }
    };

    async setText(text){
        const highlightedCode = await Shiki.codeToHtml(text, {lang:'js', theme:EditorContext.theme});
        let lines = highlightedCode.split('<span class="line">').slice(1).map(line => line.slice(0, -8));

        // const tabSpaces = ''.padStart(EditorContext.spacesPerTab, '');
        // lines = lines.map(line => line.replace('\t', tabSpaces).replace(new RegExp(`\\s{${EditorContext.spacesPerTab}}`, 'g'), `<span class="tab">${tabSpaces}</span>`));
        this.table.setRows(lines.map(lineText => new CodeLine(lineText)));
        this.updateLineGutterWidth();
        
        for(const range of this.ranges){ range.apply(this.lines); }
    };

    async setTheme(theme){
        EditorContext.theme = theme;
        this.setText(this.text);
    };

    select(ranges){
        for(const range of this.ranges){ range.clear(); }
        
        this.ranges = SelectionRange.mergeRanges(ranges);
        for(const range of this.ranges){ range.apply(this.lines); }
    };

    delete(ranges){
        for(const range of SelectionRange.normalizeRanges(SelectionRange.mergeRanges(ranges)).sort((a, b) => Position.greaterThan(a.tail, b.tail) ? -1 : 1)){
            const lineBounds = range.getPerLineRanges(this.lines).reverse();

            const removingRows = [];
            for(const bound of lineBounds){
                const line = this.lines[bound.line];

                console.log(bound)

                if(bound.start===0 && (bound.end===-1 || bound.end===line.length)){
                    removingRows.push(line);
                }else if(bound.end === -1){
                    line.text = line.text.slice(0, bound.start);
                }else{
                    line.text = line.text.slice(0, bound.start) + line.text.slice(bound.end, line.length);
                }
            }
            this.table.removeRows(removingRows);
        }

        this.setText(this.text);
    };

    insert(insertions){

    };

    // updates how many pixels are needed to fit the line numbers
    updateLineGutterWidth(){
        this.lineNumberGutterWidth = Math.max(1, Math.ceil(Math.log10(this.lines.length)))*this.fontWidth + 6;
        this.style.setProperty('--line-number-gutter-width', `${this.lineNumberGutterWidth}px`);
    };

    setFont(font, size){
        this.style.setProperty('--line-font-family', font);
        this.style.setProperty('--line-font-size', `${size}px`);
        this.style.setProperty('--line-highlight-radius', `${size*.2}px`);
        
        // canvas used to measure text
        const textRuler = document.createElement('canvas');
        const context = textRuler.getContext('2d');
        context.font = `${size}px ${font}`;
        this.fontWidth = context.measureText('M').width;
        this.style.setProperty('--line-font-width', `${this.fontWidth}px`);
        
        CodeLine.charWidth = this.fontWidth;
        this.fontSize = size;
        
        this.updateLineGutterWidth();
        this.table.setRowHeight(size * 1.2);
    };

    // returns the line and column number of a given x/y position relative to the code window
    getPositionAt(x, y){
        return new Position(Math.floor((y + this.table._renderedState.scrollPosition) / this.table._rowHeight), Math.floor((x - this.lineNumberGutterWidth) / this.fontWidth));
    };

    getLine(index){
        return this._rows[index] || null;
    };

    exec(command){
        if(command.delete?.length){ this.delete(command.delete); }
        if(command.insert?.length){ this.insert(command.insert); }
        if(command.ranges){ this.select(command.ranges); }
        return true;
    };

    get text(){
        return this.lines.map(line => line.text).join('\n');
    };

    get lines(){
        return this.table._rows;
    };
};
customElements.define('editor-context', EditorContext);