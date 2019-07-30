import { SceneNode } from './_.js';

const ControlNode = SceneNode.create();

Object.defineProperty(ControlNode, 'vector', {
  get() {
    return this.payload.vector;
  },
  set(value) {
    this.payload.vector = value;
  },
});

export { ControlNode };
