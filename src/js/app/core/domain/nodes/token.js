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
});

export { Token };
