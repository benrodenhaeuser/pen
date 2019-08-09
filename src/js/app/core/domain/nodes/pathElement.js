import { MarkupElement } from './_.js';
import { types } from './_.js';

const PathElement = Object.create(MarkupElement);

Object.assign(PathElement, {
  create(opts = {}) {
    return MarkupElement.create
      .bind(this)()
      .set({
        type: types.PATHELEMENT,
      })
      .set(opts);
  },
});

export { PathElement };
