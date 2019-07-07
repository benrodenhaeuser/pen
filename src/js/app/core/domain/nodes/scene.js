import { Node } from './node.js';

const Scene = Object.create(Node);
Scene.type  = 'scene';

const xmlns = 'http://www.w3.org/2000/svg';

Scene.toVDOMNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'data-key':   this.key,
      'data-type': 'content',
      'viewBox':    this.viewBox.toString(),
      xmlns:       'http://www.w3.org/2000/svg',
    },
  };
};

Scene.toSVGNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'viewBox': this.viewBox.toString(),
      xmlns:     xmlns,
    },
  };
};

Scene.toOpeningTag = function() {
  return {
    markup: `<svg xmlns="${xmlns}" viewBox="${this.viewBox.toString()}">`,
    key: this.key,
  };
};

Scene.toClosingTag = function() {
  return {
    markup: '</svg>',
    key: this.key,
  };
};

export { Scene }
