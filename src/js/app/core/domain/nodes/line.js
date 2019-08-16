import { MarkupNode } from './_.js';
import { types } from './_.js';

const Line = Object.create(MarkupNode);
Line.defineProps(['indent']);

Object.assign(Line, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.LINE })
      .set(opts);
  },
});

export { Line };
