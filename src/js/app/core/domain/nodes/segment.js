import { SceneNode } from './_.js';
import { Anchor } from './_.js';
import { HandleIn } from './_.js';
import { HandleOut } from './_.js';

const Segment = Object.create(SceneNode);
Segment.type = 'segment';

Object.assign(Segment, {
  placePenTip(nodeType) {
    const node = this.children.find(node => node.type === nodeType);

    if (node) {
      this.canvas.removePenTip();
      node.class = node.class.add('tip');
    }
  },

  appendAnchor() {
    const anchor = Anchor.create();
    this.append(anchor);
    return anchor;
  },

  appendHandleIn() {
    const handleIn = HandleIn.create();
    this.append(handleIn);
    return handleIn;
  },

  appendHandleOut() {
    const handleOut = HandleOut.create();
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
