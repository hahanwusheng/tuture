import { Chunk } from '../../DiffView';
import { Diff } from '../../../types';

const chunk: Chunk = {
  changes: [
    {
      type: 'add',
      add: true,
      content: 'I am the coolest one',
      ln: 1,
    },
    {
      type: 'add',
      add: true,
      content: 'I am the coolest one',
      ln: 2,
    },
  ],
  content: 'I am the coolest one',
  newStart: 1,
  oldStart: 0,
  newLines: 5,
  oldLines: 1,
};

const diffItem: Diff = {
  file: 'cool.ts',
  explain: {
    pre: 'Can you be more funny?',
    post: 'Oh yes',
  },
};
const diff: Diff[] = [];
Array(10).map(() => diff.push(diffItem));

export { chunk, diff };
