import { SceneNode } from './_.js';
import { Anchor } from './_.js';
import { HandleIn } from './_.js';
import { HandleOut } from './_.js';

const Segment = Object.create(SceneNode);
Segment.type = 'segment';

Object.assign(Segment, {
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
    return this.children.find(child => child.type === 'anchor');
  },
});

Object.defineProperty(Segment, 'handleIn', {
  get() {
    return this.children.find(child => child.type === 'handleIn');
  },
});

Object.defineProperty(Segment, 'handleOut', {
  get() {
    return this.children.find(child => child.type === 'handleOut');
  },
});

export { Segment };
