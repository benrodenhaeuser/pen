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

  appendAnchor(vector) {
    const anchor = Anchor.create();
    anchor.vector = vector;
    this.append(anchor);
    return anchor;
  },

  appendHandleIn(vector) {
    const handleIn = HandleIn.create();
    handleIn.vector = vector;
    this.append(handleIn);
    return handleIn;
  },

  appendHandleOut(vector) {
    const handleOut = HandleOut.create();
    handleOut.vector = vector;
    this.append(handleOut);
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
