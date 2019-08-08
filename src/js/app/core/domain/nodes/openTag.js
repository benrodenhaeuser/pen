import { Tag } from './_.js';
import { types } from './_.js';

const OpenTag = Object.create(Tag);

Object.assign(OpenTag, {
  create(text) {
    return Tag
      .create.bind(this)(text)
      .set({ type: types.OPENTAG });
  },
});

export { OpenTag };
