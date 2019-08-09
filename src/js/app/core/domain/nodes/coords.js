import { MarkupNode } from './_.js';
import { types } from './_.js';

const Coords = Object.create(MarkupNode);

Object.assign(Coords, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.COORDS })
      .set(opts);
  },
});

export { Coords };
