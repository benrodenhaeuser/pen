import { SceneNode } from './_.js';

const ControlNode = SceneNode.create();

Object.assign(ControlNode, {
  placePenTip() {
    this.canvas.removePenTip();
    this.class = this.class.add('tip');
    this.parent.class = this.parent.class.add('containsTip');
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
