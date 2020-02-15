import isHotkey from 'is-hotkey';
import {
  getBeforeText,
  selectWithinBlock,
  toggleMark,
  toggleBlock,
  isBlockActive,
  detectBlockFormat,
  deleteLine,
  decreaseItemDepth,
  increaseItemDepth,
} from 'editure';
import * as F from 'editure-constants';

const MARK_HOTKEYS = {
  'mod+b': F.BOLD,
  'mod+i': F.ITALIC,
  'mod+u': F.UNDERLINE,
  'ctrl+`': F.CODE,
  'mod+k': F.LINK,
  'mod+shift+`': F.STRIKETHROUGH,
};

const BLOCK_HOTKEYS = {
  'mod+0': F.PARAGRAPH,
  'mod+1': F.H1,
  'mod+2': F.H2,
  'mod+3': F.H3,
  'mod+4': F.H4,
  'mod+shift+c': F.CODE_BLOCK,
  'mod+shift+i': F.IMAGE,
  'mod+shift+u': F.BLOCK_QUOTE,
  'mod+alt+u': F.BULLETED_LIST,
  'mod+alt+o': F.NUMBERED_LIST,
  'mod+alt+-': F.HR,
};

const containerBlocks = [F.BLOCK_QUOTE, F.CODE_BLOCK, F.NOTE];

function handleTabKey(editor, event) {
  event.preventDefault();

  const { beforeText } = getBeforeText(editor);
  const isInList = !!detectBlockFormat(editor, [
    F.BULLETED_LIST,
    F.NUMBERED_LIST,
  ]);

  if (!beforeText.length && isInList) {
    increaseItemDepth(editor);
  } else if (beforeText.length && isInList) {
    editor.insertText('\t');
  } else if (isBlockActive(editor, F.CODE_BLOCK)) {
    editor.insertText('  ');
  } else {
    editor.insertText('\t');
  }
}

function handleShiftTabKey(editor, event) {
  event.preventDefault();
  if (isBlockActive(editor, F.LIST_ITEM)) {
    decreaseItemDepth(editor);
  }
}

function handleSelectAll(editor, event) {
  const format = detectBlockFormat(editor, containerBlocks);
  if (format) {
    event.preventDefault();
    selectWithinBlock(editor, format, { how: 'all' });
  }
}

function handleSelectUpperLeftAll(editor, event) {
  const format = detectBlockFormat(editor, containerBlocks);
  if (format) {
    event.preventDefault();
    selectWithinBlock(editor, format, { how: 'upper-left' });
  }
}

function handleSelectLowerRightAll(editor, event) {
  const format = detectBlockFormat(editor, containerBlocks);
  if (detectBlockFormat(editor, [F.CODE_BLOCK, F.BLOCK_QUOTE, F.NOTE])) {
    event.preventDefault();
    selectWithinBlock(editor, format, { how: 'lower-right' });
  }
}

function handleDeleteLine(editor, event) {
  event.preventDefault();
  deleteLine(editor);
}

function handleExitBlock(editor, event) {
  const format = detectBlockFormat(editor, [
    F.CODE_BLOCK,
    F.BLOCK_QUOTE,
    F.NOTE,
  ]);

  if (format) {
    event.preventDefault();

    selectWithinBlock(editor, format, { how: 'all', collapse: 'end' });
    editor.insertBreak();

    toggleBlock(editor, format, {}, { exit: true });
  }
}

export default function createHotKeysHandler(editor, buttonRefs) {
  const { imageBtnRef, linkBtnRef } = buttonRefs;

  return (event) => {
    /* eslint-disable no-restricted-syntax */
    for (const hotkey in MARK_HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const mark = MARK_HOTKEYS[hotkey];

        if (mark === F.LINK) {
          linkBtnRef.current.click();
        } else {
          toggleMark(editor, mark);
        }
        return;
      }
    }

    for (const hotkey in BLOCK_HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const mark = BLOCK_HOTKEYS[hotkey];

        if (mark === F.IMAGE) {
          imageBtnRef.current.click();
        } else {
          toggleBlock(editor, mark);
        }

        return;
      }
    }

    // 全选，在代码块/引用里面按 mod+a 或者 shift + command + up
    // 应该选择代码块/引用内的内容
    if (isHotkey('mod+a', event)) {
      handleSelectAll(editor, event);
      return;
    }

    if (isHotkey('mod+shift+up', event)) {
      handleSelectUpperLeftAll(editor, event);
      return;
    }

    if (isHotkey('mod+shift+down', event)) {
      handleSelectLowerRightAll(editor, event);
      return;
    }

    // 删除，在代码块/引用里面按 mod+delete 或者 shift + command + up
    // 应该删除代码块/引用中当前行之前的内容
    if (isHotkey('mod+backspace', event)) {
      handleDeleteLine(editor, event);
      return;
    }

    if (isHotkey('mod+enter', event)) {
      handleExitBlock(editor, event);
      return;
    }

    if (isHotkey('shift+tab', event)) {
      handleShiftTabKey(editor, event);
    }

    if (isHotkey('tab', event)) {
      handleTabKey(editor, event);
    }
  };
}
