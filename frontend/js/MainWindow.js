import AddStyle from '/js/__common__/Style.js';
import SetTheme from '/js/__common__/Theme.js';

import '/js/keyboard/OnscreenKeyboard.js';
import '/js/activitybar/ActivityBar.js';
import '/js/editor/CodeEditor.js'

// set default theme to monokai
SetTheme('monokai');

AddStyle(/*css*/`
    .main-window{
        font-family: "Consolas";
        position: relative;
    }
`);

export default class MainWindow extends HTMLElement{
    constructor(){
        super();

        this.classList.add('main-window', 'flex-col');

        this.innerHTML = /*html*/`
            <onscreen-keyboard></onscreen-keyboard>

            <div class="flex-row flex-fill">
                <activity-bar></activity-bar>
                <code-editor class="flex-fill"></code-editor>
            </div>
        `;
    };
};
customElements.define('main-window', MainWindow);