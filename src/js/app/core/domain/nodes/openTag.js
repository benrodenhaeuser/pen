import { Tag } from './_.js';
import { types } from './_.js';

const OpenTag = Object.create(Tag);

Object.assign(OpenTag, {
  create() {
    return Tag
      .create.bind(this)()
      .set({ type: types.OPENTAG });
  },
});

export { OpenTag };
