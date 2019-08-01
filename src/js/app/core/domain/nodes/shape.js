import { GraphicsNode } from './_.js';
import { Spline } from './_.js';
import { Matrix } from '../geometry/_.js';
import { Vector } from '../geometry/_.js';
import { SyntaxTree } from './_.js';

const Shape = Object.create(GraphicsNode);
Shape.type = 'shape';

Shape.create = function() {
  return GraphicsNode
    .create.bind(this)()
    .set(this.shapeDefaults());
};

Shape.appendSpline = function() {
  const spline = Spline.create();
  this.append(spline);
  return spline;
};

Shape.shapeDefaults = function() {
  return {
    splitter: Vector.create(-1000, -1000),
  };
}

Shape.toVDOMNode = function() {
  return {
    tag: 'path',
    children: [],
    props: {
      'data-type': 'shape',
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

    d += `M ${segment.anchor.vector.x} ${segment.anchor.vector.y}`;

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
        d += ` ${prevSeg.handleOut.vector.x} ${prevSeg.handleOut.vector.y}`;
      }

      if (currSeg.handleIn) {
        d += ` ${currSeg.handleIn.vector.x} ${currSeg.handleIn.vector.y}`;
      }

      d += ` ${currSeg.anchor.vector.x} ${currSeg.anchor.vector.y}`;
    }
  }

  return d;
};

export { Shape };
