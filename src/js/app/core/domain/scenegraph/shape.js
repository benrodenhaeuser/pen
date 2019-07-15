import { Node } from './node.js';
import { Matrix } from '../geometry.js';
import { SyntaxTree } from '../syntaxtree.js';

const Shape = Object.create(Node);
Shape.type = 'shape';

Shape.toVDOMNode = function() {
  return {
    tag: 'path',
    children: [],
    props: {
      'data-type': 'content',
      'data-key': this.key,
      d: this.pathString(),
      transform: this.transform.toString(),
      class: this.class.toString(),
    },
  };
};

Shape.toVDOMCurves = function() {
  const nodes = [];
  const splines = this.children;

  for (let spline of splines) {
    const segments = spline.children;
    const curves = spline.curves();

    for (let i = 0; i < curves.length; i += 1) {
      // this node will be the "hit target" for the curve:
      nodes.push({
        tag: 'path',
        children: [],
        props: {
          'data-type': 'curve',
          'data-key': segments[i].key,
          d: curves[i].toPathString(),
          transform: this.transform.toString(),
        },
      });

      // this node will display the curve stroke:
      nodes.push({
        tag: 'path',
        children: [],
        props: {
          'data-type': 'curve-stroke',
          d: curves[i].toPathString(),
          transform: this.transform.toString(),
        },
      });
    }
  }

  return nodes;
};

Shape.toSVGNode = function() {
  const svgNode = {
    tag: 'path',
    children: [],
    props: { d: this.pathString() },
  };

  if (!this.transform.equals(Matrix.identity())) {
    svgNode.props.transform = this.transform.toString();
  }

  return svgNode;
};

Shape.toASTNodes = function() {
  const open = SyntaxTree.create();

  if (!this.transform.equals(Matrix.identity())) {
    open.markup = `<path d="${this.pathString()}" transform="${this.transform.toString()}">`;
  } else {
    open.markup = `<path d="${this.pathString()}">`;
  }

  open.key = this.key;
  open.class = this.class;

  const close = SyntaxTree.create();
  close.markup = '</path>';
  close.key = this.key;

  return {
    open: open,
    close: close,
  };
};

Shape.pathString = function() {
  let d = '';

  for (let spline of this.children) {
    const segment = spline.children[0];
    d += `M ${segment.anchor.x} ${segment.anchor.y}`;

    for (let i = 1; i < spline.children.length; i += 1) {
      const currSeg = spline.children[i];
      const prevSeg = spline.children[i - 1];

      if (prevSeg.handleOut && currSeg.handleIn) {
        d += ' C';
      } else if (currSeg.handleIn || prevSeg.handleOut) {
        d += ' Q';
      } else {
        d += ' L';
      }

      if (prevSeg.handleOut) {
        d += ` ${prevSeg.handleOut.x} ${prevSeg.handleOut.y}`;
      }

      if (currSeg.handleIn) {
        d += ` ${currSeg.handleIn.x} ${currSeg.handleIn.y}`;
      }

      d += ` ${currSeg.anchor.x} ${currSeg.anchor.y}`;
    }
  }

  return d;
};

export { Shape };
