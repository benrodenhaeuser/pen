import { Node } from './node.js';
import { ASTNode } from '../../ports/export/ast.js';

const Shape = Object.create(Node);
Shape.type  = 'shape';

Shape.toVDOMNode = function() {
  return {
    tag:      'path',
    children: [],
    props: {
      'data-type': 'poly-curve',
      d:           this.pathString(),
      transform:   this.transform.toString(),
    },
  };
};

Shape.toVDOMCurves = function() {
  const nodes   = [];
  const splines = this.children;

  for (let spline of splines) {
    const segments = spline.children;
    const curves   = spline.curves();

    for (let i = 0; i < curves.length; i += 1) {
      // this node will be the hit target for the curve:
      nodes.push({
        tag:      'path',
        children: [],
        props: {
          'data-type': 'curve',
          'data-key':   segments[i].key,
          d:           curves[i].toPathString(),
          transform:   this.transform.toString(),
        },
      });

      // this node will display the curve stroke:
      nodes.push({
        tag:      'path',
        children: [],
        props: {
          'data-type': 'curve-stroke',
          d:           curves[i].toPathString(),
          transform:   this.transform.toString(),
        },
      });
    }
  }

  return nodes;
};

Shape.toSVGNode = function() {
  const svgNode = {
    tag:      'path',
    children: [],
    props:    { d: this.pathString() },
  };

  // TODO: don't want to set a transform if it's a trivial transform
  svgNode.props.transform = this.transform.toString();

  return svgNode;
};

Shape.toASTNodes = function() {
  const open = ASTNode.create();
  open.markup = `<path d="${this.pathString()}" transform="${this.transform.toString()}">`;
  open.key = this.key;

  const close = ASTNode.create();
  close.markup = '</path';
  close.key = this.key;

  return {
    open: open,
    close: close
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

export { Shape }
