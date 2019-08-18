import { MarkupNode } from './_.js';
import { types } from './_.js';

const Token = Object.create(MarkupNode);
Token.defineProps(['markup']);

Object.assign(Token, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.TOKEN })
      .set(opts);
  },

  getRange() {
    const lineNode = this.parent;
    const rootNode = lineNode.parent;

    const line = rootNode.children.indexOf(lineNode);
    const tokenIndex = lineNode.children.indexOf(this);

    const before = lineNode.children
      .slice(0, tokenIndex)
      .reduce((sum, node) => sum + node.markup.length, 0) + tokenIndex;

    const from = {
      line: line,
      ch: before
    };

    const to = {
      line: line,
      ch: before + this.markup.length
    };

    return [from, to];
  },
});

export { Token };
