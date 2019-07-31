import { SceneNode } from './_.js';
import { Anchor } from './_.js';
import { HandleIn } from './_.js';
import { HandleOut } from './_.js';

const Segment = Object.create(SceneNode);
Segment.type = 'segment';

// convenience API for getting/setting anchor and handle values of a segment

Object.defineProperty(Segment, 'anchor', {
  get() {
    const anchorNode = this.children.find(child => child.type === 'anchor');

    if (anchorNode) {
      return anchorNode.vector;
    }

    return null;
  },
  set(value) {
    let anchorNode;

    if (this.anchor) {
      anchorNode = this.children.find(child => child.type === 'anchor');
    } else {
      anchorNode = Anchor.create();
      this.append(anchorNode);
    }

    anchorNode.vector = value;
  },
});

Object.defineProperty(Segment, 'handleIn', {
  get() {
    const handleNode = this.children.find(child => child.type === 'handleIn');

    if (handleNode) {
      return handleNode.vector;
    }

    return null;
  },
  
  set(value) {
    let handleNode;

    if (this.handleIn) {
      handleNode = this.children.find(child => child.type === 'handleIn');
    } else {
      handleNode = HandleIn.create();
      this.append(handleNode);
    }

    handleNode.vector = value;
  },
});

Object.defineProperty(Segment, 'handleOut', {
  get() {
    const handleNode = this.children.find(child => child.type === 'handleOut');

    if (handleNode) {
      return handleNode.vector;
    }

    return null;
  },
  set(value) {
    let handleNode;

    if (this.handleOut) {
      handleNode = this.children.find(child => child.type === 'handleOut');
    } else {
      handleNode = HandleOut.create();
      this.append(handleNode);
    }

    handleNode.vector = value;
  },
});

export { Segment };
