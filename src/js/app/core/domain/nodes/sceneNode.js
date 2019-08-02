import { Node } from './_.js';

const SceneNode = Object.create(Node);

Object.defineProperty(SceneNode, 'canvas', {
  get() {
    return this.findAncestor(node => node.type === 'canvas');
  },
});

export { SceneNode };
