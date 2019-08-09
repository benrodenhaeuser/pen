import { MarkupElement } from './_.js';
import { types } from './_.js';

const SVGElement = Object.create(MarkupElement);

Object.assign(SVGElement, {
  create(opts = {}) {
    return MarkupElement.create
      .bind(this)()
      .set({
        type: types.SVGELEMENT,
      })
      .set(opts);
  },
});

export { SVGElement };
