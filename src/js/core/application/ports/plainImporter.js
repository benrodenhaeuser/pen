import { Root, Shape, Group      } from '../domain/types.js';
import { Spline, Segment, Anchor } from '../domain/types.js';
import { HandleIn, HandleOut,    } from '../domain/types.js';

const plainImporter = {
  build(object) {
    let node;

    switch (object.type) {
      case 'root':
        node = Root.create();
        node.type = 'root';
        // viewbox
        break;

      case 'group':
        node = Group.create();
        node.type = 'group';
        // transform
        // classes
        // bounds
        break;

      case 'shape':
        node = Shape.create();
        // transform
        // classes
        // bounds
        node.type = 'shape';
        break;

      case 'spline':
        node = Spline.create();
        // NO PAYLOAD
        node.type = 'spline';
        break;

      case 'segment':
        node = Segment.create();
        // NO PAYLOAD
        node.type = 'segment';
        break;

      // **the next three cases are essentially the same**

      case 'anchor':
        node = Anchor.create();
        // vector
        node.type = 'anchor';
        break;

      case 'handleIn':
        node = HandleIn.create();
        // vector
        node.type = 'handleIn';
        break;

      case 'handleOut':
        node = HandleOut.create();
        // vector
        node.type = 'handleOut';
        break;
    }

    // NOTE: this is crucial, we don't want fresh keys here!
    node._id = object._id;

    for (let child of object.children) {
      node.append(this.build(child));
    }

    return node;
  },
};

export { plainImporter };
