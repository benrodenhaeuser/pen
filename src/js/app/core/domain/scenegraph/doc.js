import { Node } from './node.js';
import { createID } from '../helpers.js';

const Doc = Object.create(Node);
Doc.type = 'doc';

// Object.assign(Graphics, {
//   create() {
//     return Node
//       .create.bind(this)()
//       .set(this.graphicsDefaults());
//   },
// });

Object.assign(Doc, {
  create() {
    return Node.create
      .bind(this)()
      .set({ _id: createID() });
  },
});

export { Doc };
