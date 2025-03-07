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

    'Backspace': deleteSelectionBackwards,
    'Shift+Backspace': deleteSelectionBackwards,
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