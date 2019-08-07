import { Node } from './_.js';
import { createID } from '../helpers/_.js';
import { types } from './_.js';

const Doc = Object.create(Node);
Doc.defineProps(['_id']);

Object.assign(Doc, {
  create() {
    return Node.create
      .bind(this)()
      .set({
        type: types.DOC,
        _id: createID(),
      });
  },
});

export { Doc };
