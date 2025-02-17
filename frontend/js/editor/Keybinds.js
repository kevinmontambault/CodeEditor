import { indentMore, indentLess, insertNewline, insertBlankLine, moveLineUp, moveLineDown, insertTab } from '@codemirror/commands';
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

import {EditorSelection} from '@codemirror/state';

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

const addCursorUp = ({state, dispatch}) => {
    const mainIndex = state.selection.mainIndex;
    const ranges = [...state.selection.ranges];
    const mainPosition = ranges[state.selection.mainIndex].head;
    const mainLine = state.doc.lineAt(mainPosition);
    const mainCol = mainPosition - mainLine.from;

    for(const range of state.selection.ranges){
        const line = state.doc.lineAt(range.head);
        if(line.number === 1){ continue; }

        const nextLine = state.doc.line(line.number - 1);
        const newHead = Math.min(nextLine.from+mainCol, nextLine.to);
        ranges.push(EditorSelection.range(newHead, newHead));
    }

    dispatch({selection:EditorSelection.create(ranges, mainIndex)});
    return true;
};

const addCursorDown = ({state, dispatch}) => {
    const mainIndex = state.selection.mainIndex;
    const ranges = [...state.selection.ranges];
    const mainPosition = ranges[state.selection.mainIndex].head;
    const mainLine = state.doc.lineAt(mainPosition);
    const mainCol = mainPosition - mainLine.from;

    console.log(state.doc.lines)

    for(const range of state.selection.ranges){
        const line = state.doc.lineAt(range.head);
        if(state.doc.lines === line.number){ continue; }

        const nextLine = state.doc.line(line.number + 1);
        const newHead = Math.min(nextLine.from+mainCol, nextLine.to);
        ranges.push(EditorSelection.range(newHead, newHead));
    }

    dispatch({selection:EditorSelection.create(ranges, mainIndex)});
    return true;
};

// standard key presses
export default {
    'Ctrl-KeyA': selectAll,

    'Ctrl-KeyZ': undo,
    'Ctrl-Shift-KeyZ': redo,

    'Space': insertCharacter(' '),

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
    'Shift-Alt-ArrowUp': addCursorUp,
    'Ctrl-Shift-ArrowUp': moveLineUp,

    'ArrowDown': cursorLineDown,
    'Shift-ArrowDown': selectLineDown,
    'Shift-Alt-ArrowDown': addCursorDown,
    'Ctrl-Shift-ArrowDown': moveLineDown,

    'Home': cursorLineBoundaryBackward,
    'Shift-End': selectLineBoundaryBackward,
    'Shift-Ctrl-Home': selectDocStart,
    'Ctrl-Home': cursorDocStart,

    'End': cursorLineBoundaryForward,
    'Shift-End': selectLineBoundaryForward,
    'Shift-Ctrl-End': selectDocEnd,
    'Ctrl-End': cursorDocEnd,

    'Ctrl-BracketRight': indentMore,
    'Ctrl-BracketLeft': indentLess,
    'Tab': insertTab,
    'Shift-Tab': indentLess,
};