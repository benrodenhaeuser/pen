import { Tag } from './_.js';
import { types } from './_.js';

const OpenTag = Object.create(Tag);

Object.assign(OpenTag, {
  create(opts = {}) {
    return Tag.create
      .bind(this)()
      .set({ type: types.OPENTAG })
      .set(opts);
  },
});

export { OpenTag };
