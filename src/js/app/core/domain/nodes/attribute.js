import { MarkupNode } from './_.js';
import { types } from './_.js';

const Attribute = Object.create(MarkupNode);

Object.assign(Attribute, {
  create() {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.ATTRIBUTE });
  },
});

export { Attribute };
