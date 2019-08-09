import { Tag } from './_.js';
import { types } from './_.js';

const CloseTag = Object.create(Tag);

Object.assign(CloseTag, {
  create(opts = {}) {
    return Tag.create
      .bind(this)()
      .set({ type: types.CLOSETAG })
      .set(opts);
  },
});

export { CloseTag };
