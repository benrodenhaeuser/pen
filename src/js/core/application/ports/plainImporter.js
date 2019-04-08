import { Root, Shape, Group      } from '../domain/types.js';
import { Spline, Segment, Anchor } from '../domain/types.js';
import { HandleIn, HandleOut,    } from '../domain/types.js';
import { Matrix                  } from '../domain/matrix.js';
import { Vector                  } from '../domain/vector.js';
import { Rectangle               } from '../domain/rectangle.js';
import { Class                   } from '../domain/class.js';

const plainImporter = {
  build(object) {
    let node;

    switch (object.type) {
      case 'root':
        node = Root.create();
        break;
      case 'group':
        node = Group.create();
        break;
      case 'shape':
        node = Shape.create();
        break;
      case 'spline':
        node = Spline.create();
        break;
      case 'segment':
        node = Segment.create();
        break;
      case 'anchor':
        node = Anchor.create();
        node.type = 'anchor';
        break;
      case 'handleIn':
        node = HandleIn.create();
        break;
      case 'handleOut':
        node = HandleOut.create();
        break;
    }

    node.type = object.type;
    node._id = object._id;
    this.setPayload(node, object);

    for (let child of object.children) {
      node.append(this.build(child));
    }

    return node;
  },

  setPayload(node, object) {
    for (let [key, value] of Object.entries(object.payload)) {
      // console.log(key, value);

      switch (key) {
        // looks OK
        case 'viewBox':
          const viewBox = Rectangle.createFromDimensions(
            object.payload.viewBox.x,
            object.payload.viewBox.y,
            object.payload.viewBox.width,
            object.payload.viewBox.height
          );
          node.viewBox = viewBox;
          break;

        // looks OK
        case 'transform':
          const matrix = Matrix.create(object.payload.transform);
          node.transform = matrix;
          break;

        // looks OK
        case 'class':
          const classes = Class.create(object.payload.class);
          node.class = classes;
          break;

        // looks OK
        case 'bounds':
          if (value) {
            const bounds = Rectangle.createFromDimensions(
              object.payload.bounds.x,
              object.payload.bounds.y,
              object.payload.bounds.width,
              object.payload.bounds.height
            );
            node.bounds = bounds;
          }
          break;

        case 'vector':
          const vector = Vector.create(
            object.payload.vector.x,
            object.payload.vector.y
          );
          node.vector = vector;
          break;
      }
    }
  },
};

export { plainImporter };


// why does the plain object have no bounds? Presumably there was no need to compute it yet!
