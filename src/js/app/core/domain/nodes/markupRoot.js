import { MarkupNode } from './_.js';
import { types } from './_.js';

const MarkupRoot = Object.create(MarkupNode);

Object.assign(MarkupRoot, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.MARKUPROOT })
      .set(opts);
  },

  findTokenByPosition(position) {
    const lineNode = this.children[position.line];
    return lineNode.findTokenByCharIndex(position.ch);
  },
});

export { MarkupRoot };
