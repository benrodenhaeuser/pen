import { Tag } from './_.js';
import { types } from './_.js';

const CloseTag = Object.create(Tag);

Object.assign(CloseTag, {
  create(text) {
    return Tag
      .create.bind(this)(text)
      .set({ type: types.CLOSETAG });
  },
});

export { CloseTag };
