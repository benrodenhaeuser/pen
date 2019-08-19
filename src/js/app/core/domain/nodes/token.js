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

    const start = lineNode.children
      .slice(0, tokenIndex)
      .reduce(
        (sum, node) => sum + node.markup.length,
        0
      ) + tokenIndex + (lineNode.indent * 2);
      // ^ TODO: magic number representing unitPad length

    const from = {
      line: line,
      ch: start
    };

    const to = {
      line: line,
      ch: start + this.markup.length
    };

    return [from, to];
  },
});

export { Token };
