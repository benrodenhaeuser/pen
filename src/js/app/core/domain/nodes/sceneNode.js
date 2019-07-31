import { Node } from './_.js';

const SceneNode = Object.create(Node);

// allow any node to jump to the root of the scene:
Object.defineProperty(SceneNode, 'canvas', {
  get() {
    return this.findAncestor(
      node => node.type === 'canvas'
    );
  },
});

export { SceneNode };
