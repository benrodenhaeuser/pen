import { Node } from './_.js';
import { types } from './_.js';

const Tools = Object.create(Node);

Object.assign(Tools, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({
        type: types.TOOLS,
      })
      .set(opts);
  },

  setActiveStatus(stateDescription) {
    for (let child of this.children) {
      child.deactivate();
    }

    switch (stateDescription.mode) {
      case 'pen':
        this.pen.activate();
        break;
      case 'select':
        this.select.activate();
        break;
    }

    if (stateDescription.layout.menuVisible) {
      this.open.activate();
    }
  },
});

Object.defineProperty(Tools, 'pen', {
  get() {
    return this.children[0];
  },
});

Object.defineProperty(Tools, 'select', {
  get() {
    return this.children[1];
  },
});

Object.defineProperty(Tools, 'open', {
  get() {
    return this.children[5];
  },
});

export { Tools };
