import { MarkupNode } from './_.js';
import { types } from './_.js';

const Rangle = Object.create(MarkupNode);

Object.assign(Rangle, {
  create() {
    return MarkupNode.create
      .bind(this)()
      .set({
        type: types.RANGLE,
        markup: '>',
      });
  },
});

export { Rangle };
