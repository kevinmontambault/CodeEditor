import AddStyle from '../__common__/Style.js';
import Drive from '../__common__/Drive.js';

import {insertCharacter, getWordBoundsAtPosition} from './Commands.js';
import Keybinds from './Keybinds.js';
import Position from './Position.js';
import './CodeArea.js';

import SelectionRange from './SelectionRange.js';

AddStyle(/*css*/`
    .editor-context{
        position: relative;
        cursor: text;
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
            <code-area></code-area>
        `;

        this.codeArea = this.querySelector('.code-area');
        this.filePath = filePath;

        this.keybinds = Keybinds;

        // cursor selections
        this.ranges = [];

        // editor font
        this.fontFamily = null;
        this.fontSize   = 0;
        this.fontWidth  = 0;
        this.codeArea.setFont("'Cascadia Mono', monospace", 14);

        // when the code area is focused, toggle the cursor animation on
        this.addEventListener('focusin', () => {
        });

        // when the element is unfocused, disable the cursor animation
        this.addEventListener('focusout', () => {
        });

        // cursor selection and dragging
        this.addEventListener('pointerdown', downEvent => {
            const downPosition = this.codeArea.getPositionAt(downEvent.offsetX, downEvent.offsetY);

            const selectedLine = this.lines[downPosition.line];
            if(!selectedLine){ return; }
            
            const newPosition = new SelectionRange(new Position(downPosition.line, Math.min(downPosition.col, selectedLine.length)));
            const ranges = downEvent.ctrlKey ? [...this.ranges, newPosition] : [newPosition];

            const moveCallback = moveEvent => {
                const movePosition = this.codeArea.getPositionAt(moveEvent.offsetX, moveEvent.offsetY);
                newPosition.head = movePosition;
                this.select(ranges);
            };

            window.addEventListener('pointermove', moveCallback);
            window.addEventListener('pointerup', upEvent => {
                window.removeEventListener('pointermove', moveCallback);
            }, {once:true});

            this.select(ranges);
        });

        this.addEventListener('dblclick', downEvent => {
            const downPosition = this.codeArea.getPositionAt(downEvent.offsetX, downEvent.offsetY);
            const wordBounds = getWordBoundsAtPosition(this, downPosition);
            if(!wordBounds){ return; }

            this.select([new SelectionRange(new Position(downPosition.line, wordBounds.end), new Position(downPosition.line, wordBounds.start))]);
        });

        this.addEventListener('keydown', downEvent => {
            const keyString = [];
            if(downEvent.ctrlKey){ keyString.push('Ctrl'); }
            if(downEvent.shiftKey){ keyString.push('Shift'); }
            if(downEvent.altKey){ keyString.push('Alt'); }
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
                // this.setText(response.text.replace(/ /g, '\t'));
            }else{
                // errorText.innerText = 'Failed to fetch file';
                // errorText.classList.remove('hidden');
            }
        }
    };

    async setText(text){
        this.codeArea.setText(text);
        for(const range of this.ranges){ range.apply(this.lines); }
    };

    changeFontSize(...args){
        this.codeArea.changeFontSize(...args);
    };

    async setTheme(theme){
        EditorContext.theme = theme;
        this.setText(this.text);
    };

    select(ranges){
        for(const range of this.ranges){ range.clear(); }

        // this.ranges = SelectionRange.mergeRanges(ranges);
        this.ranges = SelectionRange.mergeRanges(ranges);
        for(const range of this.ranges){ range.apply(this.lines); }
    };

    delete(ranges){
        this.codeArea.deleteText(ranges);
        // for(const range of SelectionRange.normalizeRanges(SelectionRange.mergeRanges(ranges)).sort((a, b) => Position.greaterThan(a.tail, b.tail) ? -1 : 1)){
        //     const lineBounds = range.getPerLineRanges(this.lines);

        //     const removingLines = [];
        //     for(const bound of lineBounds){
        //         const line = this.lines[bound.line];

        //         if(bound.start===0 && (bound.end===-1 || bound.end===line.length)){
        //             removingLines.push(bound.line);
        //         }else if(bound.end === -1){
        //             line.setText(line.text.slice(0, bound.start));
        //         }else{
        //             line.setText(line.text.slice(0, bound.start) + line.text.slice(bound.end, line.length));
        //         }
        //     }

        //     if(removingLines.length){
        //         this.codeArea.remove(removingLines[0], removingLines[removingLines.length-1]+1);
        //     }
        // }
    };

    insert(insertions){

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
        return this.codeArea._lines;
    };
};
customElements.define('editor-context', EditorContext);