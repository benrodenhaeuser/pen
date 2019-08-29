import { Node } from './_.js';
import { createID } from '../helpers/_.js';
import { types } from './_.js';

const Doc = Object.create(Node);
Doc.defineProps(['_id', 'canvasWidth']);

Object.assign(Doc, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({
        type: types.DOC,
        _id: createID(),
      })
      .set(opts);
  },
});

export { Doc };
