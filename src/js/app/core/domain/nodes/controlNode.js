import { SceneNode } from './_.js';

const ControlNode = SceneNode.create();
ControlNode.defineProps(['vector']);

Object.assign(ControlNode, {
  placePenTip() {
    this.canvas.removePenTip();
    this.class = this.class.add('tip');
    this.parent.class = this.parent.class.add('containsTip');
  },

  toString() {
    return this.vector.toString();
  },

  enclosingShape() {
    return this.parent && this.parent.parent && this.parent.parent.parent;
  }
});

export { ControlNode };
