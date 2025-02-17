import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    .onscreen-keyboard{
        width: 100%;
        position: absolute;
        z-index: 999;
        font-size: .8rem;
        bottom: 0;
        touch-action: none;
    }

    .onscreen-keyboard.cursor-moving .key-row>div{
        pointer-events: none;
    }

    .onscreen-keyboard.cursor-moving .touchpad{
        pointer-events: none;
    }

    .onscreen-keyboard.collapsed .collapsable{
        display: none;
    }

    .onscreen-keyboard.collapsed .hide-keyboard-icon{
        display: none;
    }
    
    .onscreen-keyboard:not(.collapsed) .show-keyboard-icon{
        display: none;
    }

    .onscreen-keyboard .cursor{
        position: fixed;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        width: 19px;
        height: 13px;
        background-image: url('/CodeEditor/img/aero_arrow_l.cur');
    }

    .onscreen-keybaord .cursor[type="auto"]{
        background-image: url('/CodeEditor/img/aero_arrow_l.cur');
    }
    
    .onscreen-keyboard .cursor[type="pointer"]{
        background-image: url('/CodeEditor/img/aero_link_l.cur');
    }

    .onscreen-keyboard .cursor[type="text"]{
        background-image: url('/CodeEditor/img/ibeam.png');
    }

    .onscreen-keyboard .center-container, .onscreen-keyboard .keyboard-container, .onscreen-keyboard .key-row{
        gap: 0.1em;
    }

    .onscreen-keyboard .key-row>div{
        box-shadow: inset -.1em -.1em #000000;
        color: #FFFFFF;
        width: 2.5em;
        height: 2.5em;
        border-radius: .2em;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        pointer-events: all;
    }

    .onscreen-keyboard .key-row>div>svg{
        fill: #FFFFFF;
    }

    onscreen-keyboard .key-row>div.pressed{
        box-shadow: inset .1em .1em #000000;
    }

    .onscreen-keyboard .touchpad{
        box-shadow: inset .1em .1em #000000;
        pointer-events: all;
    }

    .onscreen-keyboard .touchpad, .onscreen-keyboard .key-row>div{
        opacity: 0.2;
        background: #000000;
        border-radius: .2em;
        backdrop-filter: invert(10%);
    }
`);

function intersects(bb, point){
    return bb.left < point.x && bb.left+bb.width > point.x && bb.top < point.y && bb.top+bb.height > point.y;
};

export default class OnscreenKeyboard extends HTMLElement{
    static CLICK_HOLD_TIME = 300;
    static DBL_CLICK_TIME = 300;
    static CLICK_MOVE_THRESH = 6;

    static isElementFocusable(element){
        if(element.hasAttribute('tabindex')){
            if(element.getAttribute('tabindex').startsWith('-')){ return false; }
            return true;
        }

        if(element.hasAttribute('disabled')){ return false; }

        if(element.tagName === 'INPUT'){ return true; }
        if(element.tagName === 'SELECT'){ return true; }
        if(element.tagName === 'TEXTAREA'){ return true; }
        if(element.tagName === 'BUTTON'){ return true; }
        if(element.tagName === 'DETAILS'){ return true; }
        if(element.tagName === 'IFRAME'){ return true; }

        if(element.hasAttribute('href')){
            if(element.tagName === 'A'){ return true; }
            if(element.tagName === 'AREA'){ return true; }
        }

        if(element.hasAttribute('contentEditable')){ return true; }

        return false;
    };

    constructor(){
        super();

        this.classList.add('onscreen-keyboard', 'collapsed', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="cursor" type="auto"></div>

            <div></div>

            <div class="center-container flex-row">
                <div class="left-touchpad touchpad flex-fill"></div>

                <div class="keyboard-container flex-col">
                    <div class="key-row flex-row">
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code=""                 noemit style="width:3.4em"></div>
                        <div data-code="ToggleCollapsed"  noemit style="width:3.4em">
                            <svg class="hide-keyboard-icon" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg>
                            <svg class="show-keyboard-icon" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
                        </div>
                    </div>

                    <div class="key-row flex-row collapsable">
                        <div data-code="Backquote" data-key1="\`" data-key2="~" repeat                    >${'`'}</div>
                        <div data-code="Digit1"    data-key1="1"  data-key2="!" repeat                    >1</div>
                        <div data-code="Digit2"    data-key1="2"  data-key2="@" repeat                    >2</div>
                        <div data-code="Digit3"    data-key1="3"  data-key2="#" repeat                    >3</div>
                        <div data-code="Digit4"    data-key1="4"  data-key2="$" repeat                    >4</div>
                        <div data-code="Digit5"    data-key1="5"  data-key2="%" repeat                    >5</div>
                        <div data-code="Digit6"    data-key1="6"  data-key2="^" repeat                    >6</div>
                        <div data-code="Digit7"    data-key1="7"  data-key2="&" repeat                    >7</div>
                        <div data-code="Digit8"    data-key1="8"  data-key2="*" repeat                    >8</div>
                        <div data-code="Digit9"    data-key1="9"  data-key2="(" repeat                    >9</div>
                        <div data-code="Digit0"    data-key1="0"  data-key2=")" repeat                    >0</div>
                        <div data-code="Minus"     data-key1="-"  data-key2="_" repeat                    >-</div>
                        <div data-code="Equal"     data-key1="="  data-key2="+" repeat                    >=</div>
                        <div data-code="Backspace"                              repeat style="width:5.5em">Backspace</div>
                        <div data-code="Delete"                                 repeat                    >Del</div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="Tab"                                       repeat      style="width:3.8em">Tab</div>
                        <div data-code="KeyQ"         data-key1="q"  data-key2="Q" repeat caps                    >q</div>
                        <div data-code="KeyW"         data-key1="w"  data-key2="W" repeat caps                    >w</div>
                        <div data-code="KeyE"         data-key1="e"  data-key2="E" repeat caps                    >e</div>
                        <div data-code="KeyR"         data-key1="r"  data-key2="R" repeat caps                    >r</div>
                        <div data-code="KeyT"         data-key1="t"  data-key2="T" repeat caps                    >t</div>
                        <div data-code="KeyY"         data-key1="y"  data-key2="Y" repeat caps                    >y</div>
                        <div data-code="KeyU"         data-key1="u"  data-key2="U" repeat caps                    >u</div>
                        <div data-code="KeyI"         data-key1="i"  data-key2="I" repeat caps                    >i</div>
                        <div data-code="KeyO"         data-key1="o"  data-key2="O" repeat caps                    >o</div>
                        <div data-code="KeyP"         data-key1="p"  data-key2="P" repeat caps                    >p</div>
                        <div data-code="BracketLeft"  data-key1="["  data-key2="{" repeat                         >[</div>
                        <div data-code="BracketRight" data-key1="]"  data-key2="}" repeat                         >]</div>
                        <div data-code="Backslash"    data-key1="\\" data-key2="|" repeat      style="width:4.2em">\\</div>
                        <div data-code="Home"                                                                     >Home</div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="Capslock"                                           style="width:4.7em">Caps</div>
                        <div data-code="KeyA"      data-key1="a" data-key2="A" repeat caps                    >a</div>
                        <div data-code="KeyS"      data-key1="s" data-key2="S" repeat caps                    >s</div>
                        <div data-code="KeyD"      data-key1="d" data-key2="D" repeat caps                    >d</div>
                        <div data-code="KeyF"      data-key1="f" data-key2="F" repeat caps                    >f</div>
                        <div data-code="KeyG"      data-key1="g" data-key2="G" repeat caps                    >g</div>
                        <div data-code="KeyH"      data-key1="h" data-key2="H" repeat caps                    >h</div>
                        <div data-code="KeyJ"      data-key1="j" data-key2="J" repeat caps                    >j</div>
                        <div data-code="KeyK"      data-key1="k" data-key2="K" repeat caps                    >k</div>
                        <div data-code="KeyL"      data-key1="l" data-key2="L" repeat caps                    >l</div>
                        <div data-code="Semicolon" data-key1=";" data-key2=":" repeat                         >;</div>
                        <div data-code="Quote"     data-key1="'" data-key2='"' repeat                         >'</div>
                        <div data-code="Enter"                                 repeat      style="width:5.9em">Enter</div>
                        <div data-code="End"                                   repeat                         >End</div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="ShiftLeft"                                          style="width:6em"  >Shift</div>
                        <div data-code="KeyZ"       data-key1="z" data-key2="Z" repeat caps                    >z</div>
                        <div data-code="KeyX"       data-key1="x" data-key2="X" repeat caps                    >x</div>
                        <div data-code="KeyC"       data-key1="c" data-key2="C" repeat caps                    >c</div>
                        <div data-code="KeyV"       data-key1="v" data-key2="V" repeat caps                    >v</div>
                        <div data-code="KeyB"       data-key1="b" data-key2="B" repeat caps                    >b</div>
                        <div data-code="KeyN"       data-key1="n" data-key2="N" repeat caps                    >n</div>
                        <div data-code="KeyM"       data-key1="m" data-key2="M" repeat caps                    >m</div>
                        <div data-code="Comma"      data-key1="," data-key2="<" repeat                         >,</div>
                        <div data-code="Period"     data-key1="." data-key2=">" repeat                         >.</div>
                        <div data-code="Slash"      data-key1="/" data-key2="?" repeat                         >/</div>
                        <div data-code="ShiftRight"                                         style="width:7.2em">Shift</div>
                        <div data-code="ArrowUp"                                repeat                         ><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg></div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="ControlLeft"         style="width:3.6em">Ctrl</div>
                        <div data-code="AltLeft"             style="width:3.6em">Alt</div>
                        <div data-code="Space"        repeat style="width:19.3em"></div>
                        <div data-code="AltRight"            style="width:3.6em">Alt</div>
                        <div data-code="ControlRight"        style="width:3.6em">Ctrl</div>
                        <div data-code="ArrowLeft"    repeat                    ><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg></div>
                        <div data-code="ArrowRight"   repeat                    ><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></div>
                        <div data-code="ArrowDown"    repeat                    ><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg></div>
                    </div>
                </div>

                <div class="right-touchpad touchpad flex-fill"></div>
            </div>

            <div></div>
        `;

        // cursor variables
        this.cursor = this.querySelector('.cursor');
        this.cursorPosition = {x:0, y:0};
        this.windowSize = {width:0, height:0};
        this.clickedButtonsMap = {};
        this.orientation = 'portrait';
        new ResizeObserver(([entry]) => {
            this.windowSize.width = entry.contentRect.height;
            this.windowSize.height = entry.contentRect.width;
            this.orientation = window.innerWidth>window.innerHeight ? 'landscape' : 'portrait';
        }).observe(document.body);
        this.lastHoveredElement = null;

        // the element which is currently receiving key events;
        this.focusedElement = null;

        // position the cursor once the document loads
        window.addEventListener('load', () => window.requestAnimationFrame(() => this.moveCursor(50, 50)));

        window.addEventListener('focusin', ({target}) => {
            target.classList.add('focused');
            this.focusedElement = target;
        });

        window.addEventListener('focusout', ({target}) => {
            target.classList.remove('focused');
            this.focusedElement = null;
        });
        
        // cursor movement
        let heldCount = 0;
        let cursorStart = null;
        let cursorDelta = null;
        for(const touchpad of this.querySelectorAll('.touchpad')){
            touchpad.addEventListener('pointerdown', downEvent => {
                if(!downEvent.isTrusted){ return; }

                // its the first touchpad to be pressed
                if(!heldCount){
                    cursorStart = {x:this.cursorPosition.x, y:this.cursorPosition.y};
                    cursorDelta = {x:0, y:0};
                    this.classList.add('cursor-moving');
                }
                heldCount += 1;

                // only dispatch mousedown after brief hold
                let   downTriggered = false;
                const movementSum = {x:0, y:0};
                const downTimeout = setTimeout(() => {
                    if(movementSum.x + movementSum.y < OnscreenKeyboard.CLICK_MOVE_THRESH){
                        this.mouseDown(downEvent.buttons);
                        downTriggered = true;
                    }
                }, OnscreenKeyboard.CLICK_HOLD_TIME);

                // move cursor relative to starting position
                const moveCallback = moveEvent => {
                    if(!moveEvent.isTrusted || moveEvent.pointerId !== downEvent.pointerId){ return; }

                    cursorDelta.x += moveEvent.movementX;
                    cursorDelta.y += moveEvent.movementY;
                    movementSum.x += Math.abs(moveEvent.movementX);
                    movementSum.y += Math.abs(moveEvent.movementY);

                    this.moveCursor(cursorStart.x+cursorDelta.x, cursorStart.y+cursorDelta.y);
                    moveEvent.stopImmediatePropagation();
                    moveEvent.preventDefault();
                };
                window.addEventListener('pointermove', moveCallback);

                // when pointer is released
                const upCallback = upEvent => {
                    if(!upEvent.isTrusted || upEvent.pointerId !== downEvent.pointerId){ return; }

                    clearTimeout(downTimeout);

                    // remove callbacks
                    window.removeEventListener('pointermove', moveCallback);
                    window.removeEventListener('pointerup', upCallback);

                    // if the mousedown event was triggered, dispatch the accompanying mouseup event
                    if(downTriggered){ this.mouseUp(upEvent.buttons); }

                    // if the cursor didn't really move, AND the mouse wasn't held long enough to dispatch the mousedown event, dispatch a full click event
                    else if(movementSum.x + movementSum.y < OnscreenKeyboard.CLICK_MOVE_THRESH){ window.requestAnimationFrame(() => this.click(upEvent.buttons)); }

                    heldCount -= 1;
                    if(!heldCount){ this.classList.remove('cursor-moving'); }

                    upEvent.stopImmediatePropagation();
                    upEvent.preventDefault();
                };
                window.addEventListener('pointerup', upCallback);

                downEvent.stopImmediatePropagation();
                downEvent.preventDefault();
            });
        }

        this.capsableKeys  = Array.from(this.querySelectorAll('div[caps]'));
        this.shiftableKeys = Array.from(this.querySelectorAll('div[data-key2]'));
        
        // list of key elements and a map to get a key element given it's id
        this.keys   = Array.from(this.querySelectorAll('div[data-code]'));
        this.keyMap = Object.fromEntries(this.keys.map(key => [key.getAttribute('data-code'), key]));

        // keeps track of which pointer id is currently pressing which key
        this.pressedKeyMap = {};

        // keeps track of which key ids are pressed
        this.pressedKeys = new Set();
        this.capsLockOn = false;

        // keeps track of which keys have repeat intervals
        this.keyRepeatTimeout = null;

        // setup attributes per key element
        for(const keyElement of this.keys){
            
            // add a 'pressedCount' attribute to each key element to keep track of how many pointers have pressed that key down
            keyElement.pressedCount = 0;

            // get attributes from HTML
            if(keyElement.hasAttribute('data-code')){ keyElement.code = keyElement.getAttribute('data-code'); }
            if(keyElement.hasAttribute('data-key1')){ keyElement.key1 = keyElement.getAttribute('data-key1'); }
            if(keyElement.hasAttribute('data-key2')){ keyElement.key2 = keyElement.getAttribute('data-key2'); }
            keyElement.repeat = keyElement.hasAttribute('repeat');
            keyElement.caps   = keyElement.hasAttribute('caps');
            keyElement.key    = keyElement.key1 || keyElement.code;
            keyElement.emit   = !keyElement.hasAttribute('noemit');

            // listen for key presses
            keyElement.addEventListener('pointerdown', downEvent => {
                this.pressedKeyMap[downEvent.pointerId] = keyElement;
                this.pressKeyElement(keyElement);

                downEvent.preventDefault();
                downEvent.stopImmediatePropagation();
            });
        };

        // keeps track of the last timestamp some click events occured, so they can be counted up if occuring shortly after one another
        // for example, these timestamps make sure dblclick event can be dispatched correctly
        this.lastMouseDown = {timestamp:0, counter:0};
        this.lastMouseUp   = {timestamp:0, counter:0};
        this.lastClick     = {timestamp:0, counter:0};
        

        this.addEventListener('pointerup', upEvent => {
            const keyElement = this.pressedKeyMap[upEvent.pointerId];
            if(!keyElement){ return; }

            delete this.pressedKeyMap[upEvent.pointerId];

            this.releaseKeyElement(keyElement);

            upEvent.preventDefault();
            upEvent.stopImmediatePropagation();
        });
    };

    pressKeyElement(keyElement){
        keyElement.classList.add('pressed');
        keyElement.pressedCount += 1;

        // a new key was pressed, so remove the old repeat timeout
        if(this.keyRepeatTimeout){
            clearTimeout(this.keyRepeatTimeout);
            this.keyRepeatTimeout = null;
        }

        // handle a key that was pressed for the first time
        if(keyElement.pressedCount === 1){
            this.pressedKeys.add(keyElement.code);

            // change upper-case letters
            if(keyElement.code === 'ShiftLeft' || keyElement.code === 'ShiftRight'){
                for(const key of this.shiftableKeys){
                    key.innerText = key.key2;
                    key.key = key.key2;
                }
            }

            // only dispatch a key event if there is a focused element to receive it, and the keyboard key has a key code (isn't a custom action key)
            if(this.focusedElement && keyElement.emit){
                const downEventArgs = {
                    timestamp: performance.now(),
                    bubbles: true,
                    cancelable: true,
                    shiftHeld: this.shiftHeld,
                    ctrlHeld: this.ctrlHeld,
                    altHeld: this.altHeld,
                    metaKey: this.metaHeld,
                    code: keyElement.code,
                    key: keyElement.key,
                    detail: 0,
                    view: window,
                    composed: true,
                    srcElement: this.focusedElement,
                    target: this.focusedElement,
                };

                // add a timeout for key repeats
                if(keyElement.repeat){
                    this.keyRepeatTimeout = setTimeout(function loop(){
                        this.dispatchEvent(new KeyboardEvent('keydown', Object.assign({
                            timestamp: performance.now(),
                            repeat: true,
                        }, downEventArgs)));

                        this.keyRepeatTimeout = setTimeout(loop.bind(this), 75);
                    }.bind(this), 500);
                }

                // dispatch keydown
                this.focusedElement.dispatchEvent(new KeyboardEvent('keydown', Object.assign({
                    timestamp: performance.now(),
                    repeat: false,
                }, downEventArgs)));
            }
        }
    };
    
    // press a key based on the key code
    pressKey(keyCode){
        const keyElement = this.keyMap[keyCode];
        if(!keyElement){ throw new Error(`No such key '${keyCode}'`); }
        this.pressKeyElement(keyElement);
    };
    
    releaseKeyElement(keyElement){
        keyElement.classList.remove('pressed');
        keyElement.pressedCount -= 1;
        
        // handle a key that was fully released by all pointers
        if(!keyElement.pressedCount){
            this.pressedKeys.delete(keyElement.code);

            // remove key repeat timeout if it exists
            if(this.keyRepeatTimeout){
                clearTimeout(this.keyRepeatTimeout);
                this.keyRepeatTimeout = null;
            }

            // toggle the onscreen keyboard
            if(keyElement.code === 'ToggleCollapsed'){ return this.classList.toggle('collapsed'); }

            // change upper-case letters
            if((keyElement.code === 'ShiftLeft' || keyElement.code === 'ShiftRight') && !this.shiftHeld){
                if(!this.capsLockOn){
                    for(const capsableKey of this.capsableKeys){
                        capsableKey.innerText = capsableKey.key1;
                        capsableKey.key = capsableKey.key1;
                    }
                }

                for(const shiftableKey of this.shiftableKeys){
                    shiftableKey.innerText = shiftableKey.key1;
                    shiftableKey.key = shiftableKey.key1;
                }
            }

            // release caps lock
            if(keyElement.code === 'Capslock'){
                this.capsLockOn = !this.capsLockOn;

                if(!this.capsLockOn){
                    if(!this.shiftHeld){
                        for(const capsableKey of this.capsableKeys){
                            capsableKey.innerText = capsableKey.key1;
                            capsableKey.key = capsableKey.key1;
                        }
                    }
                }else{
                    for(const capsableKey of this.capsableKeys){
                        capsableKey.innerText = capsableKey.key2;
                        capsableKey.key = capsableKey.key2;
                    }
                }
            }

            if(this.focusedElement){
                this.focusedElement.dispatchEvent(new KeyboardEvent('keyup', {
                    timestamp: performance.now(),
                    shiftHeld: this.shiftHeld,
                    ctrlHeld: this.ctrlHeld,
                    altHeld: this.altHeld,
                    metaKey: this.metaHeld,
                    key: keyElement.key,
                }));
            }
        }
    };

    releaseKey(keyCode){
        const keyElement = this.keyMap[keyCode];
        if(!keyElement){ throw new Error(`No such key '${keyCode}'`); }
        this.releaseKeyElement(keyElement);
    };

    shiftCursor(dx, dy){
        this.moveCursor(this.cursorPosition.x+dx, this.cursorPosition.y+dy);
    };

    moveCursor(x, y){
        const newX = Math.min(Math.max(x, 0), this.windowSize.width);
        const newY = Math.min(Math.max(y, 0), this.windowSize.height);

        const deltaX = newX - this.cursorPosition.x;
        const deltaY = newY - this.cursorPosition.y;

        this.cursorPosition.x = newX;
        this.cursorPosition.y = newY;

        if(this.orientation === 'portrait'){
            this.cursor.style.left = `${Math.round(this.cursorPosition.y-6)}px`;
            this.cursor.style.top = `${Math.round(this.windowSize.width - this.cursorPosition.x-9)}px`;
        }else{
            this.cursor.style.left = `${Math.round(this.cursorPosition.x-9)}px`;
            this.cursor.style.top = `${Math.round(this.cursorPosition.y-6)}px`;
        }

        // pointer enter and leave events
        const element = this.getElementUnderCursor();
        if(element !== this.lastHoveredElement){
            if(this.lastHoveredElement){

                // remove hovered class from parent elements
                let curr = this.lastHoveredElement;
                do{
                    curr.classList.remove('hovered');
                    curr = curr.parentNode;
                }while(curr && (!element || !curr.contains(element)) && curr.classList);

                this.lastHoveredElement.dispatchEvent(new PointerEvent('pointerleave'));
                this.lastHoveredElement.dispatchEvent(new MouseEvent('mouseleave'));
            }

            if(element){

                // add hovered class to all parent elements
                let cursorStyle = null;
                let curr = element;
                do{
                    if(!cursorStyle){
                        const cursor = window.getComputedStyle(curr).cursor;
                        if(cursor !== 'auto'){ cursorStyle = cursor; }
                    }
                    curr.classList.add('hovered');
                    curr = curr.parentNode;
                }while(curr && curr.classList && !curr.classList.contains('hovered'));

                this.cursor.setAttribute('type', cursorStyle || 'auto');

                element.dispatchEvent(new PointerEvent('pointerleave'));
                element.dispatchEvent(new MouseEvent('mouseleave'));
            }
        }

        // pointer move
        if(element){
            const eventArgs = {
                bubbles: true,
                cancelable: true,
                movementX: deltaX,
                movementY: deltaY,
                clientX: this.cursorPosition.x,
                clientY: this.cursorPosition.y,
                screenX: window.screenLeft + this.cursorPosition.x,
                screenY: window.screenTop + this.cursorPosition.y,
            };
            
            element.dispatchEvent(new PointerEvent('pointermove', eventArgs));
            element.dispatchEvent(new MouseEvent('mousemove', eventArgs));
        }

        this.lastHoveredElement = element;
    };

    click(buttons){
        return this.mouseDown(buttons) && this.mouseUp(buttons);
    };

    leftClick(){
        return this.click(1); // Left mouse button
    };
    
    rightClick(){
        return this.click(2); // right mouse button
    };

    mouseDown(button){
        const elementAtPosition = this.getElementUnderCursor();
        if(!elementAtPosition){ return false; }

        // check for double clicks
        if(this.lastMouseDown.timestamp > Date.now()-OnscreenKeyboard.DBL_CLICK_TIME){ this.lastMouseDown.counter += 1; }
        else{ this.lastMouseDown.counter = 1; }
        this.lastMouseDown.timestamp = Date.now();

        const downEventArgs = {
            bubbles: true,
            cancelable: true,
            clientX: this.cursorPosition.x,
            clientY: this.cursorPosition.y,
            screenX: window.screenLeft + this.cursorPosition.x,
            screenY: window.screenTop + this.cursorPosition.y,
            ctrlKey: this.ctrlHeld,
            shiftKey: this.shiftHeld,
            altKey: this.altHeld,
            metaKey: this.metaHeld,
            buttons: button,
            view: window,
            detail: this.lastMouseDown.counter,
        };
        elementAtPosition.dispatchEvent(new PointerEvent('pointerdown', downEventArgs));
        elementAtPosition.dispatchEvent(new MouseEvent('mousedown', downEventArgs));

        this.clickedButtonsMap[button] = elementAtPosition;

        return true;
    };

    mouseUp(button){
        const elementAtPosition = this.getElementUnderCursor();
        if(!elementAtPosition){ return false; }

        // check for double clicks
        if(this.lastMouseUp.timestamp > Date.now()-OnscreenKeyboard.DBL_CLICK_TIME){ this.lastMouseUp.counter += 1; }
        else{ this.lastMouseUp.counter = 1; }
        this.lastMouseUp.timestamp = Date.now();

        const upEventArgs = {
            bubbles: true,
            cancelable: true,
            clientX: this.cursorPosition.x,
            clientY: this.cursorPosition.y,
            ctrlKey: this.ctrlHeld,
            shiftKey: this.shiftHeld,
            altKey: this.altHeld,
            metaKey: this.metaHeld,
            buttons: button,
            detail: this.lastMouseUp.counter,
        };
        elementAtPosition.dispatchEvent(new PointerEvent('pointerup', upEventArgs));
        elementAtPosition.dispatchEvent(new MouseEvent('mouseup', upEventArgs));

        // pointer down and up on the same element
        if(this.clickedButtonsMap[button] === elementAtPosition){
            elementAtPosition.dispatchEvent(new MouseEvent('click', upEventArgs));

            // double click
            if(this.lastMouseUp.counter === 2){
                elementAtPosition.dispatchEvent(new MouseEvent('dblclick', upEventArgs));
            }
        }

        delete this.clickedButtonsMap[button];

        if(this.focusedElement && this.focusedElement !== elementAtPosition){
            this.focusedElement.blur();
            this.focusedElement?.dispatchEvent(new Event('focusout', {cancelable:true, bubbles:true}));
        }
        if(OnscreenKeyboard.isElementFocusable(elementAtPosition)){
            elementAtPosition.focus();
            elementAtPosition.dispatchEvent(new Event('focusin', {cancelable:true, bubbles:true}));
        }

        return true;
    };

    getElementUnderCursor(){
        this.classList.add('cursor-moving');
        const elementAt = document.elementFromPoint(this.cursorPosition.x, this.cursorPosition.y) || null;
        this.classList.remove('cursor-moving');
        return elementAt;
    };

    get shiftHeld(){
        return this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');
    };

    get ctrlHeld(){
        return this.pressedKeys.has('ControlLeft') || this.pressedKeys.has('ControlRight');
    };
    
    get altHeld(){
        return this.pressedKeys.has('AltLeft') || this.pressedKeys.has('AltRight');
    };
    
    get metaHeld(){
        return this.pressedKeys.has('MetaLeft') || this.pressedKeys.has('MetaRight');
    };
};
customElements.define('onscreen-keyboard', OnscreenKeyboard);