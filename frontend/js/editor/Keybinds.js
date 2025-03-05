import {
    cursorMoveUp,
    cursorMoveDown,
    cursorMoveLeft,
    cursorWordLeft,
    cursorSubwordLeft,
    cursorLineLeft,
    cursorDocStart,
    cursorMoveRight,
    cursorWordRight,
    cursorSubwordRight,
    cursorLineRight,
    cursorDocEnd,
    selectLineUp,
    selectLineDown,
    selectCharLeft,
    selectWordLeft,
    selectSubwordLeft,
    selectLineLeft,
    selectDocStart,
    selectCharRight,
    selectWordRight,
    selectSubwordRight,
    selectLineRight,
    selectDocEnd,
    selectAll,
    deleteSelectionForward,
    deleteWordForward,
    deleteSubwordForward,
    deleteSelectionBackwards,
    deleteWordBackwards,
    deleteSubwordBackwards,
    addCursorUp,
    addCursorDown,
    addCursorOnSelection,
    removeExtraCursors,
    fontSizeUp,
    fontSizeDown,
    overwriteNewline,
    insertNewlineUp,
    insertNewlineDown,
    overwriteText,
    undo,
    redo,
    copySelection,
    cutSelection,
    paste,
    save
} from './Commands.js';

function createInsertText(letter){
    return editor => overwriteText(editor, letter);
};

// standard key presses
export default {

    // default lower-case keys
    'KeyA': createInsertText('a'),
    'KeyB': createInsertText('b'),
    'KeyC': createInsertText('c'),
    'KeyD': createInsertText('d'),
    'KeyE': createInsertText('e'),
    'KeyF': createInsertText('f'),
    'KeyG': createInsertText('g'),
    'KeyH': createInsertText('h'),
    'KeyI': createInsertText('i'),
    'KeyJ': createInsertText('j'),
    'KeyK': createInsertText('k'),
    'KeyL': createInsertText('l'),
    'KeyM': createInsertText('m'),
    'KeyN': createInsertText('n'),
    'KeyO': createInsertText('o'),
    'KeyP': createInsertText('p'),
    'KeyQ': createInsertText('q'),
    'KeyR': createInsertText('r'),
    'KeyS': createInsertText('s'),
    'KeyT': createInsertText('t'),
    'KeyU': createInsertText('u'),
    'KeyV': createInsertText('v'),
    'KeyW': createInsertText('w'),
    'KeyX': createInsertText('x'),
    'KeyY': createInsertText('y'),
    'KeyZ': createInsertText('z'),
    'Backquote': createInsertText('`'),
    'Digit1': createInsertText('1'),
    'Digit2': createInsertText('2'),
    'Digit3': createInsertText('3'),
    'Digit4': createInsertText('4'),
    'Digit5': createInsertText('5'),
    'Digit6': createInsertText('6'),
    'Digit7': createInsertText('7'),
    'Digit8': createInsertText('8'),
    'Digit9': createInsertText('9'),
    'Digit0': createInsertText('0'),
    'Minus': createInsertText('-'),
    'Equal': createInsertText('='),
    'BracketLeft': createInsertText('['),
    'BracketRight': createInsertText(']'),
    'Backslash': createInsertText('\\'),
    'Semicolon': createInsertText(';'),
    'Quote': createInsertText('\''),
    'Comma': createInsertText(','),
    'Period': createInsertText('.'),
    'Slash': createInsertText('/'),

    'Shift+KeyA': createInsertText('A'),
    'Shift+KeyB': createInsertText('B'),
    'Shift+KeyC': createInsertText('C'),
    'Shift+KeyD': createInsertText('D'),
    'Shift+KeyE': createInsertText('E'),
    'Shift+KeyF': createInsertText('F'),
    'Shift+KeyG': createInsertText('G'),
    'Shift+KeyH': createInsertText('H'),
    'Shift+KeyI': createInsertText('I'),
    'Shift+KeyJ': createInsertText('J'),
    'Shift+KeyK': createInsertText('K'),
    'Shift+KeyL': createInsertText('L'),
    'Shift+KeyM': createInsertText('M'),
    'Shift+KeyN': createInsertText('N'),
    'Shift+KeyO': createInsertText('O'),
    'Shift+KeyP': createInsertText('P'),
    'Shift+KeyQ': createInsertText('Q'),
    'Shift+KeyR': createInsertText('R'),
    'Shift+KeyS': createInsertText('S'),
    'Shift+KeyT': createInsertText('T'),
    'Shift+KeyU': createInsertText('U'),
    'Shift+KeyV': createInsertText('V'),
    'Shift+KeyW': createInsertText('W'),
    'Shift+KeyX': createInsertText('X'),
    'Shift+KeyY': createInsertText('Y'),
    'Shift+KeyZ': createInsertText('Z'),
    'Shift+Backquote': createInsertText('~'),
    'Shift+Digit1': createInsertText('!'),
    'Shift+Digit2': createInsertText('@'),
    'Shift+Digit3': createInsertText('#'),
    'Shift+Digit4': createInsertText('$'),
    'Shift+Digit5': createInsertText('%'),
    'Shift+Digit6': createInsertText('^'),
    'Shift+Digit7': createInsertText('&'),
    'Shift+Digit8': createInsertText('*'),
    'Shift+Digit9': createInsertText('('),
    'Shift+Digit0': createInsertText(')'),
    'Shift+Minus': createInsertText('_'),
    'Shift+Equal': createInsertText('+'),
    'Shift+BracketLeft': createInsertText('{'),
    'Shift+BracketRight': createInsertText('}'),
    'Shift+Backslash': createInsertText('|'),
    'Shift+Semicolon': createInsertText(':'),
    'Shift+Quote': createInsertText('"'),
    'Shift+Comma': createInsertText('<'),
    'Shift+Period': createInsertText('>'),
    'Shift+Slash': createInsertText('?'),

    'Backspace': deleteSelectionBackwards,
    'Ctrl+Backspace': deleteWordBackwards,
    'Alt+Backspace': deleteSubwordBackwards,

    'Delete': deleteSelectionForward,
    'Ctrl+Delete': deleteWordForward,
    'Alt+Delete': deleteSubwordForward,

    'Enter': overwriteNewline,
    'Ctrl+Enter': insertNewlineDown,
    'Ctrl+Shift+Enter': insertNewlineUp,

    'ArrowLeft': cursorMoveLeft,
    'Ctrl+ArrowLeft': cursorWordLeft,
    'Alt+ArrowLeft': cursorSubwordLeft,
    'Shift+ArrowLeft': selectCharLeft,
    'Ctrl+Shift+ArrowLeft': selectWordLeft,
    'Shift+Alt+ArrowLeft': selectSubwordLeft,

    'ArrowRight': cursorMoveRight,
    'Ctrl+ArrowRight': cursorWordRight,
    'Alt+ArrowRight': cursorSubwordRight,
    'Shift+ArrowRight': selectCharRight,
    'Ctrl+Shift+ArrowRight': selectWordRight,
    'Shift+Alt+ArrowRight': selectSubwordRight,

    'ArrowUp': cursorMoveUp,
    'Shift+ArrowUp': selectLineUp,
    'Shift+Alt+ArrowUp': addCursorUp,
    // 'Ctrl+Shift+ArrowUp': moveLineUp,

    'ArrowDown': cursorMoveDown,
    'Shift+ArrowDown': selectLineDown,
    'Shift+Alt+ArrowDown': addCursorDown,
    // 'Ctrl+Shift+ArrowDown': moveLineDown,

    'Home': cursorLineLeft,
    'Shift+Home': selectLineLeft,
    'Ctrl+Shift+Home': selectDocStart,
    'Ctrl+Home': cursorDocStart,

    'End': cursorLineRight,
    'Shift+End': selectLineRight,
    'Ctrl+Shift+End': selectDocEnd,
    'Ctrl+End': cursorDocEnd,

    // 'Ctrl+BracketRight': indentMore,
    // 'Ctrl+BracketLeft': indentLess,
    // 'Tab': insertTab,
    // 'Shift+Tab': indentLess,
    'Ctrl+Shift+KeyL': addCursorOnSelection,
    'Escape': removeExtraCursors,

    'Ctrl+Equal': fontSizeUp,
    'Ctrl+Minus': fontSizeDown,
    
    'Ctrl+KeyA': selectAll,
    'Ctrl+KeyS': save,
    'Ctrl+KeyX': cutSelection,
    'Ctrl+KeyC': copySelection,
    'Ctrl+KeyV': paste,

    // 'Ctrl+KeyZ': undo,
    'Ctrl+Shift+KeyZ': redo,

    // keyboard specific binds
    'Save': save,
    'Copy': copySelection,
    'Cut': cutSelection,
    'Paste': paste,
};