import AddStyle from '../__common__/Style.js';

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
            <div class="code-area" tabindex="1"></div>
        `;

        // // multicursor and highlighting
        // const cursors = {};
        // this.addEventListener('pointerdown', event => {
        //     const downPosition = this.editor.posAtCoords({x:event.clientX, y:event.clientY});
        //     const newSelection = EditorSelection.range(downPosition, downPosition);

        //     const selections = [newSelection];
        //     if(event.ctrlKey || event.metaKey){
        //         for(const range of this.editor.state.selection.ranges){
        //             selections.push(range);
        //         }
        //     }

        //     window.requestAnimationFrame(() => {
        //         this.editor.dispatch({
        //             selection: EditorSelection.create(selections, 0),
        //             userEvent: 'select.pointer',
        //         });

        //         this.editor.focus();
        //     });
        // });

        // this.addEventListener('pointerup', event => {
        //     console.log(this.querySelector('.cm-content'))
        // });

        this.editor = null;

        // this.editor = CodeMirror.fromTextArea(this.querySelector('.code-area'), {
        //     mode: 'javascript',
        //     lineNumbers: true,
        //     theme: 'default'
        // });

        this.filePath = filePath;
        
        this.reload();
    };

    posAtCoords(x, y){
        const pos = this.editor.posAtCoords({x, y});
        const lineAt = this.editor.state.doc.lineAt(pos);
        return {line:lineAt.number, ch:pos-lineAt.from};
    };

    async reload(){
        const contentContainer = this.querySelector('.content-container');

        const createView = text => {
            this.editor = new EditorView({
                doc: text,
                extensions: [
                    // keymap.of(Object.entries(Keybinds).map(([key, run]) => {key, run})),
                    history(),
                    drawSelection(),
                    EditorState.allowMultipleSelections.of(true),
                ],
                parent: this.querySelector('.code-area')
            });

            this.addEventListener('pointerdown', downEvent => {
                const downPosition = this.editor.posAtCoords({x:downEvent.clientX, y:downEvent.clientY});
                const selections = [EditorSelection.range(downPosition, downPosition)];
                if(downEvent.ctrlKey){ selections.push(...this.editor.state.selection.ranges); }
                this.editor.dispatch({selection:EditorSelection.create(selections, 0)});
                this.editor.focus();
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
                    window.requestAnimationFrame(() => this.editor.focus());
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

        if(EditorContext.contentCache.has(this.filePath)){
            createView(EditorContext.contentCache.get(this.filePath));
        }else{
            this.classList.add('loading');

            const response = await (async () => {
                let response;
                try{ response = await fetch(`/drive/${this.filePath}`); }
                catch(err){ return {success:false, error:err}; }
                if(!response.ok){ return {success:false, error:new Error(`Bad status (${response.status})`)}; }

                let text;
                try{ text = await response.text(); }
                catch(err){ return {success:false, error:err}; }

                return {success:true, text};
            })();
            this.classList.remove('loading');

            if(response.success){
                EditorContext.contentCache.set(this.filePath, response.text);
                createView(response.text);
            }else{
                contentContainer.innerText = 'Failed to fetch file';
            }
        }
    };
};
customElements.define('editor-context', EditorContext);