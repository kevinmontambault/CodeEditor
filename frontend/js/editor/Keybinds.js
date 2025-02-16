import { indentMore, indentLess, indentSelection, insertNewline, insertBlankLine, moveLineUp, moveLineDown } from '@codemirror/commands';
import { cursorCharBackward, cursorCharForward, cursorDocEnd, cursorGroupBackward, cursorGroupForward, cursorLineBoundaryForward, cursorSubwordBackward, cursorSubwordForward, deleteGroupBackward, deleteGroupForward, selectCharBackward, selectCharForward, selectDocEnd, selectDocStart, selectGroupBackward, selectGroupForward, selectLineBoundaryBackward, selectLineBoundaryForward, selectSubwordBackward, selectSubwordForward } from '@codemirror/commands';
import {
    deleteCharBackward,
    deleteCharForward,

    cursorLineUp,
    cursorLineDown,
    selectLineUp,
    selectLineDown,
    selectAll,
    undo,
    redo,
    cursorLineBoundaryBackward,
    cursorDocStart
} from '@codemirror/commands';

export const insertCharacter = character => view => {
    view.dispatch({
        changes: {
            from: view.state.selection.main.from,
            insert: character,
        },

        selection: {
            anchor: view.state.selection.main.from + 1,
        }
    });

    return true;
};

const deleteSubwordForward = view => {
    if(!selectSubwordForward(view)){ return false; }

    const changes = view.state.selection.ranges;
    if(!changes.length){ return false; }
    
    view.dispatch({
        changes,
        scrollIntoView: true
    });

    return true;
};

const deleteSubwordBackward = view => {
    if(!selectSubwordBackward(view)){ return false; }

    const changes = view.state.selection.ranges;
    if(!changes.length){ return false; }
    
    view.dispatch({
        changes,
        scrollIntoView: true
    });

    return true;
};

// standard key presses
export default {
    'Ctrl-KeyA': selectAll,

    'Ctrl-KeyZ': undo,
    'Ctrl-Shift-KeyZ': redo,

    'Backspace': deleteCharBackward,
    'Ctrl-Backspace': deleteGroupBackward,
    'Alt-Backspace': deleteSubwordBackward,

    'Delete': deleteCharForward,
    'Ctrl-Delete': deleteGroupForward,
    'Alt-Delete': deleteSubwordForward,

    'Enter': insertNewline,
    'Ctrl-Enter': insertBlankLine,
    'Ctrl-Shift-Enter': insertNewline,

    'ArrowLeft': cursorCharBackward,
    'Ctrl-ArrowLeft': cursorGroupBackward,
    'Alt-ArrowLeft': cursorSubwordBackward,
    'Shift-ArrowLeft': selectCharBackward,
    'Ctrl-Shift-ArrowLeft': selectGroupBackward,
    'Shift-Alt-ArrowLeft': selectSubwordBackward,

    'ArrowRight': cursorCharForward,
    'Ctrl-ArrowRight': cursorGroupForward,
    'Alt-ArrowRight': cursorSubwordForward,
    'Shift-ArrowRight': selectCharForward,
    'Ctrl-Shift-ArrowRight': selectGroupForward,
    'Shift-Alt-ArrowRight': selectSubwordForward,

    'ArrowUp': cursorLineUp,
    'Shift-ArrowUp': selectLineUp,
    'Ctrl-Shift-ArrowUp': moveLineUp,

    'ArrowDown': cursorLineDown,
    'Shift-ArrowDown': selectLineDown,
    'Ctrl-Shift-ArrowDown': moveLineDown,

    'Home': cursorLineBoundaryBackward,
    'Shift-End': selectLineBoundaryBackward,
    'Shift-Ctrl-Home': selectDocStart,
    'Ctrl-Home': cursorDocStart,

    'End': cursorLineBoundaryForward,
    'Shift-End': selectLineBoundaryForward,
    'Shift-Ctrl-End': selectDocEnd,
    'Ctrl-End': cursorDocEnd,

    'Ctrl-BracketClose': indentMore,
    'Ctrl-BracketOpen': indentLess,
    'Tab': indentSelection
};