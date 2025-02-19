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
    addCursorUp,
    addCursorDown,
    fontSizeUp,
    fontSizeDown,
} from './Commands.js';

// standard key presses
export default {
    'Ctrl+KeyA': selectAll,

    // 'Ctrl+KeyZ': undo,
    // 'Ctrl+Shift+KeyZ': redo,

    // 'Space': insertCharacter(' '),

    // 'Backspace': deleteCharBackward,
    // 'Ctrl+Backspace': deleteGroupBackward,
    // 'Alt+Backspace': deleteSubwordBackward,

    'Delete': deleteSelectionForward,
    // 'Ctrl+Delete': deleteGroupForward,
    // 'Alt+Delete': deleteSubwordForward,

    // 'Enter': insertNewline,
    // 'Ctrl+Enter': insertBlankLine,
    // 'Ctrl+Shift+Enter': insertNewline,

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


    'Ctrl+Equal': fontSizeUp,
    'Ctrl+Minus': fontSizeDown,
};