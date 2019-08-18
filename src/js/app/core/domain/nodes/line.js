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

  findTokenByCharIndex(ch) {
    let index = 0;

    for (let token of this.children) {
      const start = index;
      const end = index + token.markup.length;

      if (start <= ch && ch <= end) {
        return token;
      }

      index = end + 1;
    }
  },
});

export { Line };
