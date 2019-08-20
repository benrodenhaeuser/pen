import { SceneNode } from './_.js';
import { Anchor } from './_.js';
import { HandleIn } from './_.js';
import { HandleOut } from './_.js';
import { types } from './_.js';

const Segment = Object.create(SceneNode);

Object.assign(Segment, {
  create(opts = {}) {
    return SceneNode.create
      .bind(this)()
      .set({ type: types.SEGMENT })
      .set(opts);
  },

  mountAnchor(vector) {
    const anchor = Anchor.create();
    anchor.vector = vector;
    this.mount(anchor);
    return anchor;
  },

  mountHandleIn(vector) {
    const handleIn = HandleIn.create();
    handleIn.vector = vector;
    this.mount(handleIn);
    return handleIn;
  },

  mountHandleOut(vector) {
    const handleOut = HandleOut.create();
    handleOut.vector = vector;
    this.mount(handleOut);
    return handleOut;
  },
});

Object.defineProperty(Segment, 'anchor', {
  get() {
    return this.children.find(child => child.type === types.ANCHOR);
  },
});

Object.defineProperty(Segment, 'handleIn', {
  get() {
    return this.children.find(child => child.type === types.HANDLEIN);
  },
});

Object.defineProperty(Segment, 'handleOut', {
  get() {
    return this.children.find(child => child.type === types.HANDLEOUT);
  },
});

export { Segment };
