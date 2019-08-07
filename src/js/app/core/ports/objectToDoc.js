import { Editor, Docs, Doc, Message } from '../domain/_.js';
import { Canvas, Shape, Group } from '../domain/_.js';
import { Spline, Segment, Anchor } from '../domain/_.js';
import { HandleIn, HandleOut } from '../domain/_.js';
import { Matrix } from '../domain/_.js';
import { Vector } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { Class } from '../domain/_.js';

const objectToDoc = object => {
  let node;

  switch (object.props.type) {
    case 'editor':
      node = Editor.create();
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
    case 'canvas':
      node = Canvas.create();
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
      break;
    case 'handleIn':
      node = HandleIn.create();
      break;
    case 'handleOut':
      node = HandleOut.create();
      break;
  }

  node.type = object.props.type;

  setprops(node, object);

  for (let child of object.children) {
    node.append(objectToDoc(child));
  }

  return node;
};

const setprops = (node, object) => {
  for (let [key, value] of Object.entries(object.props)) {
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
        node.text = value;
        break;
      case 'bounds':
        if (value) {
          node.bounds = Rectangle.createFromObject(value);
        }
        break;
      case 'vector':
        node.vector = Vector.createFromObject(value);
        break;
      default:
        node[key] = value;
    }
  }
};

export { objectToDoc };
