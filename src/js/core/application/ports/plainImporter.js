import { Store, Docs, Doc, Message   } from '../domain/types.js';
import { Scene, Shape, Group, Markup } from '../domain/types.js';
import { Spline, Segment, Anchor     } from '../domain/types.js';
import { HandleIn, HandleOut         } from '../domain/types.js';
import { Matrix                      } from '../domain/matrix.js';
import { Vector                      } from '../domain/vector.js';
import { Rectangle                   } from '../domain/rectangle.js';
import { Class                       } from '../domain/class.js';

const plainImporter = {
  build(object) {
    let node;

    switch (object.type) {
      case 'store':
        node = Store.create();
        break;
      case 'doc':
        node = Doc.create();
        break;
      case 'docs':
        node = Docs.create();
        break;
      case 'identifier':
        node = Identifier.create();
        break;
      case 'message':
        node = Message.create();
        break;
      case 'markup':
        node = Markup.create();
        break;
      case 'scene':
        node = Scene.create();
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
    node.key  = object.key;
    node._id  = object._id;
    this.setPayload(node, object);

    for (let child of object.children) {
      node.append(this.build(child));
    }

    return node;
  },

  setPayload(node, object) {
    for (let [key, value] of Object.entries(object.payload)) {
      switch (key) {
        case 'viewBox':
          node.viewBox = Rectangle.createFromObject(value);
          break;
        case 'transform':
          node.transform = Matrix.create(value);
          break;
        case 'class':
          node.class = Class.create(value);
          break;
        case 'text':
          node.payload.text = value;
          break;
        case 'bounds':
          if (value) {
            node.bounds = Rectangle.createFromObject(value);
          }
          break;
        case 'vector':
          node.vector = Vector.createFromObject(value);
          break;
      }
    }
  },
};

export { plainImporter };
