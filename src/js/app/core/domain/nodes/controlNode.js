import { SceneNode } from './_.js';

const ControlNode = SceneNode.create();

Object.assign(ControlNode, {
  placePen() {
    this.canvas.removePen();
    this.class = this.class.add('pen');
  },
});

Object.defineProperty(ControlNode, 'vector', {
  get() {
    return this.payload.vector;
  },

  set(value) {
    this.payload.vector = value;
  },
});

export { ControlNode };
