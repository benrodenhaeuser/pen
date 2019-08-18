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
    console.log(position);
    console.log(this.children.length);

    const lineNode = this.children[position.line];

    console.log(lineNode);

    const token = lineNode.findTokenByCharIndex(position.ch);

    console.log(token);

    return token;
  },

});

export { MarkupRoot };
