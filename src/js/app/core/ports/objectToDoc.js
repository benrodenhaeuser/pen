import { Editor, Docs, Doc, Message } from '../domain/_.js';
import { Canvas, Shape, Group } from '../domain/_.js';
import { Spline, Segment, Anchor } from '../domain/_.js';
import { HandleIn, HandleOut } from '../domain/_.js';
import { Matrix } from '../domain/_.js';
import { Vector } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { Class } from '../domain/_.js';

const nodeProtos = {
  Editor,
  Docs,
  Doc,
  Message,
  Canvas,
  Shape,
  Group,
  Spline,
  Segment,
  Anchor,
  HandleIn,
  HandleOut,
};

const objectToDoc = object => {
  const node = nodeProtos[capitalize(object.type)].create();
  node.type = object.type;
  setProps(node, object);

  for (let child of object.children) {
    node.append(objectToDoc(child));
  }

  return node;
};

const setProps = (node, object) => {
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

const capitalize = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export { objectToDoc };
