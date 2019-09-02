import { Node } from './_.js';
import { types } from './_.js';

const Docs = Object.create(Node);

Object.assign(Docs, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({
        type: types.DOCS,
      })
      .set(opts);
  },

  setActiveStatus(id) {
    for (let child of this.children) {
      child.deactivate();
    }

    const toActivate = this.children.find(child => child._id === id);

    if (toActivate) {
      toActivate.activate();
    }
  },
});

export { Docs };
