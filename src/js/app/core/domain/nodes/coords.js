import { MarkupNode } from './_.js';
import { types } from './_.js';

const Coords = Object.create(MarkupNode);

Object.assign(Coords, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.COORDS });
  },
});

export { Coords };
