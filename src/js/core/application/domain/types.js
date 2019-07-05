import { Node      } from './node.js';
import { Rectangle } from './rectangle.js';
import { Curve     } from './curve.js';

// Types of nodes we use

// scene graph nodes
const Scene     = Object.create(Node);
const Group     = Object.create(Node);
const Shape     = Object.create(Node);
const Spline    = Object.create(Node);
const Segment   = Object.create(Node);
const Anchor    = Object.create(Node);
const HandleIn  = Object.create(Node);
const HandleOut = Object.create(Node);

Scene.type     = 'scene';
Group.type     = 'group';
Shape.type     = 'shape';
Spline.type    = 'spline';
Segment.type   = 'segment';
Anchor.type    = 'anchor';
HandleIn.type  = 'handleIn';
HandleOut.type = 'handleOut';

// other types of nodes
const Store      = Object.create(Node);
const Doc        = Object.create(Node);
const Docs       = Object.create(Node);
const Markup     = Object.create(Node);
const Message    = Object.create(Node);
const Text       = Object.create(Node);
const Identifier = Object.create(Node);

Store.type      = 'store';
Doc.type        = 'doc';
Docs.type       = 'docs';
Markup.type     = 'markup';
Message.type    = 'message';
Text.type       = 'text';
Identifier.type = 'identifier';

// Special stuff for groups and shapes

// generate vDom nodes for scene, group and shape nodes

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

Group.toVDOMNode = function() {
  return {
    tag:      'g',
    children: [],
    props: {
      'data-key':   this.key,
      'data-type': 'content',
      transform:   this.transform.toString(),
      class:       this.class.toString(),
    },
  };
};

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

Shape.toVDOMCurveNodes = function() {
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

// generate svg-specific vDOM nodes for scene, group and shape

Scene.toSVGNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'viewBox': this.viewBox.toString(),
      xmlns:     'http://www.w3.org/2000/svg',
    },
  };
};

Group.toSVGNode = function() {
  const svgNode = {
    tag:      'g',
    children: [],
    props:    {},
  };

  svgNode.props.transform = this.transform.toString();

  return svgNode;
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

// SHAPE

// generate string for d attribute of svg path node
// (for a shape with a single segment, we will create a string
// of the form `M x y`).

// TODO: might be worth refactoring.

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

// SPLINE

// generate array of curves given by a spline
// (used to compute bounding boxes)

Spline.curves = function() {
  const theCurves = [];

  // this conditional creates a degenerate curve if
  // there is exactly 1 segment in the spline
  // TODO: this could be a problem!
  if (this.children.length === 1) {
    const start = this.children[0];
    const end   = Segment.create();

    theCurves.push(Curve.createFromSegments(start, end));
  }

  // if spline has exactly 1 segment, no curves will be
  // generated by the following code
  for (let i = 0; i + 1 < this.children.length; i += 1) {
    const start = this.children[i];
    const end = this.children[i + 1];

    theCurves.push(Curve.createFromSegments(start, end));
  }

  return theCurves;
};

// update bounding box of a spline

Spline.updateBounds = function() {
  const curves = this.curves();
  let bounds;

  // no curves
  if (curves.length === 0) {
    bounds = Rectangle.create();
    this.payload.bounds = bounds;
    return bounds;
  }

  // a single, degenerate curve
  if (curves.length === 1 && curves[0].isDegenerate()) {
    bounds = Rectangle.create();
    this.payload.bounds = bounds;
    return bounds;
  }

  // one or more (non-degenerate) curves

  bounds = curves[0] && curves[0].bounds; // computed by Bezier plugin

  for (let i = 1; i < curves.length; i += 1) {
    const curveBounds = curves[i].bounds;
    bounds = bounds.getBoundingRect(curveBounds);
  }

  this.payload.bounds = bounds;
  return bounds;
};

// SEGMENT

// convenience API for getting/setting anchor and handle values of a segment

Object.defineProperty(Segment, 'anchor', {
  get() {
    const anchorNode = this.children.find(child => child.type === 'anchor');

    if (anchorNode) {
      return anchorNode.vector;
    }

    return null;
  },
  set(value) {
    let anchorNode;

    if (this.anchor) {
      anchorNode = this.children.find(child => child.type === 'anchor');
    } else {
      anchorNode = Anchor.create();
      this.append(anchorNode);
    }

    anchorNode.vector = value;
  },
});

Object.defineProperty(Segment, 'handleIn', {
  get() {
    const handleNode = this.children.find(child => child.type === 'handleIn');

    if (handleNode) {
      return handleNode.vector;
    }

    return null;
  },
  set(value) {
    let handleNode;

    if (this.handleIn) {
      handleNode = this.children.find(child => child.type === 'handleIn');
    } else {
      handleNode = HandleIn.create();
      this.append(handleNode);
    }

    handleNode.vector = value;
  },
});

Object.defineProperty(Segment, 'handleOut', {
  get() {
    const handleNode = this.children.find(child => child.type === 'handleOut');

    if (handleNode) {
      return handleNode.vector;
    }

    return null;
  },
  set(value) {
    let handleNode;

    if (this.handleOut) {
      handleNode = this.children.find(child => child.type === 'handleOut');
    } else {
      handleNode = HandleOut.create();
      this.append(handleNode);
    }

    handleNode.vector = value;

  },
});

export {
  Scene,
  Group,
  Shape,
  Spline,
  Segment,
  Anchor,
  HandleIn,
  HandleOut,
  Store, // TODO: State
  Doc,
  Docs,
  Markup,
  Message,
  Text,
  Identifier
};
