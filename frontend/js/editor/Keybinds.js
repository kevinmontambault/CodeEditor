import {
    cursorMoveUp,
    cursorMoveDown,
    cursorMoveLeft,
    cursorWordLeft,
    cursorLineLeft,
    cursorDocStart,
    cursorMoveRight,
    cursorWordRight,
    cursorLineRight,
    cursorDocEnd,
    selectLineUp,
    selectLineDown,
    selectCharLeft,
    selectWordLeft,
    selectLineLeft,
    selectDocStart,
    selectCharRight,
    selectWordRight,
    selectLineRight,
    selectDocEnd,
    deleteSelectionForward,
    addCursorUp,
    addCursorDown,
} from './Commands.js';

// standard key presses
export default {
    // 'Ctrl+KeyA': selectAll,

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
    // 'Alt+ArrowLeft': cursorSubwordBackward,
    'Shift+ArrowLeft': selectCharLeft,
    'Ctrl+Shift+ArrowLeft': selectWordLeft,
    // 'Shift+Alt+ArrowLeft': selectSubwordBackward,

    'ArrowRight': cursorMoveRight,
    'Ctrl+ArrowRight': cursorWordRight,
    // 'Alt+ArrowRight': cursorSubwordForward,
    'Shift+ArrowRight': selectCharRight,
    'Ctrl+Shift+ArrowRight': selectWordRight,
    // 'Shift+Alt+ArrowRight': selectSubwordForward,

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
};