import { MarkupElement } from './_.js';
import { types } from './_.js';

const GElement = Object.create(MarkupElement);

Object.assign(GElement, {
  create() {
    return MarkupElement.create
      .bind(this)()
      .set({
        type: types.GELEMENT,
      });
  },
});

export { GElement };
