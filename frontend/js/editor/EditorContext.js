import AddStyle from '../__common__/Style.js';
import Drive from '../__common__/Drive.js';

import {drawSelection, EditorView, keymap} from '@codemirror/view';
import {EditorSelection, EditorState} from '@codemirror/state';
import {history} from '@codemirror/commands';

import Keybinds, {insertCharacter} from './Keybinds.js';

AddStyle(/*css*/`
    .editor-context{
        pointer-events: all;
        cursor: text;
    }

    .editor-context .code-area{
        height: 100%;
    }

    .editor-context .error-text{
        inset: 0;
    }

    .editor-context .cm-cursor{
        border-left-color: white;
        border-width: 2px;
    }
`);

export default class EditorContext extends HTMLElement{
    static contentCache = new Map();
    static focusedContext = null;
    
    constructor(fileName, filePath){
        super();

        this.classList.add('editor-context', 'scroll-container', 'flex-fill', 'hidden');

        this.innerHTML = /*html*/`
            <div class="code-area" tabindex="1" readonly disabled></div>
            <div class="error-text hidden flex-center"></div>
        `;

        this.editor = null;

        this.filePath = filePath;
        
        this.reload();
    };

    async reload(){
        const createView = text => {
            this.editor = new EditorView({
                parent: this.querySelector('.code-area'),
                doc: text,
                extensions: [
                    // keymap.of(Object.entries(Keybinds).map(([key, run]) => {key, run})),
                    history(),
                    drawSelection(),
                    EditorState.allowMultipleSelections.of(true),
                ],
            });

            this.addEventListener('pointerdown', downEvent => {
                const downPosition = this.editor.posAtCoords({x:downEvent.clientX, y:downEvent.clientY});
                const selections = [EditorSelection.range(downPosition, downPosition)];
                if(downEvent.ctrlKey){ selections.push(...this.editor.state.selection.ranges); }
                this.editor.dispatch({selection:EditorSelection.create(selections, 0)});
                // this.editor.focus();
                downEvent.preventDefault();

                const moveCallback = moveEvent => {
                    const movePosition = this.editor.posAtCoords({x:moveEvent.clientX, y:moveEvent.clientY});
                    selections.splice(0, 1, EditorSelection.range(downPosition, movePosition));
                    this.editor.dispatch({selection:EditorSelection.create(selections, 0)});
                    moveEvent.preventDefault();
                };
                
                window.addEventListener('pointermove', moveCallback);
                window.addEventListener('pointerup', upEvent => {
                    window.removeEventListener('pointermove', moveCallback);
                    // window.requestAnimationFrame(() => this.editor.focus());
                    upEvent.preventDefault();
                }, {once:true});
            });

            this.addEventListener('keydown', downEvent => {
                const modifiers = [];
                if(downEvent.ctrlKey){ modifiers.push('Ctrl'); }
                if(downEvent.shiftKey){ modifiers.push('Shift'); }
                if(downEvent.altKey){ modifiers.push('Alt'); }
                modifiers.push(downEvent.code);

                const key = modifiers.join('-');

                if(Keybinds[key]?.(this.editor)){ return downEvent.preventDefault(); }
                if(downEvent.key.length===1){ insertCharacter(downEvent.key)(this.editor); return downEvent.preventDefault(); }

                downEvent.preventDefault();
            });
            
            this.addEventListener('keyup', upEvent => {
                upEvent.preventDefault();
            });
        };

        const errorText = this.querySelector('.error-text');
        errorText.classList.add('hidden');

        if(EditorContext.contentCache.has(this.filePath)){
            createView(EditorContext.contentCache.get(this.filePath));
        }else{
            this.classList.add('loading');
            const response = await Drive.readFile(this.filePath);
            this.classList.remove('loading');

            if(response.success){
                EditorContext.contentCache.set(this.filePath, response.text);
                createView(response.text);
            }else{
                errorText.innerText = 'Failed to fetch file';
                errorText.classList.remove('hidden');
            }
        }
    };
};
customElements.define('editor-context', EditorContext);