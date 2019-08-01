import { Canvas, Shape, Group } from '../domain/_.js';
import { Spline, Segment, Anchor } from '../domain/_.js';
import { HandleIn, HandleOut } from '../domain/_.js';
import { Identifier, Doc } from '../domain/_.js';
import { Vector } from '../domain/_.js';
import { Matrix } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { Curve } from '../domain/_.js';
import { Bezier } from '/vendor/bezier/bezier.js';

const updates = {
  init() {
    this.aux = {};
  },

  after(state, input) {
    if (input.source === 'canvas') {
      state.syntaxTree = state.sceneToSyntaxTree();
    }
  },

  // SELECTION

  focus(state, input) {
    state.canvas.removeFocus();
    const target = state.canvas.findDescendantByKey(input.key);
    const hit = Vector.create(input.x, input.y);

    if (target) {
      const toFocus = target.findAncestorByClass('frontier');

      if (toFocus && toFocus.contains(hit)) {
        toFocus.focus();
      }
    }
  },

  select(state, input) {
    const node = state.canvas.findFocus();

    if (node) {
      node.select();
      this.initTransform(state, input);
    } else {
      state.canvas.removeSelection();
    }
  },

  deepSelect(state, input) {
    const target = state.canvas.findDescendantByKey(input.key);

    if (!target) {
      return;
    }

    if (target.class.includes('frontier')) {
      // use pen in shape
      target.placePen();
      state.canvas.removeFocus();
      state.label = 'penMode';
    } else {
      // select in group
      const toSelect = target.findAncestor(node => {
        return node.parent && node.parent.class.includes('frontier');
      });

      if (toSelect) {
        toSelect.select();
        state.canvas.updateFrontier(); // TODO: why do we need to do this?
        state.canvas.removeFocus();
      }
    }
  },

  // TODO: cleanup and release are very similar
  release(state, input) {
    const current = state.canvas.findSelection() || state.canvas.findPen();

    if (current) {
      state.canvas.updateBounds(current);
    }

    this.aux = {};
  },

  cleanup(state, event) {
    const current = state.canvas.findPen();

    if (current) {
      state.canvas.updateBounds(current);
    }

    state.canvas.removeSelection();
    state.canvas.removePen();
    this.aux = {};
  },

  // TODO
  // triggered by escape key
  exitEdit(state, input) {
    if (state.label === 'penMode') {
      const target = state.canvas.findPen();
      this.cleanup(state, input);
      target.select();
      state.label = 'selectMode';
    } else if (state.label === 'selectMode') {
      this.cleanup(state, input);
    }
  },

  // TRANSFORMS

  initTransform(state, input) {
    const node = state.canvas.findSelection();
    this.aux.from = Vector.create(input.x, input.y);
    this.aux.center = node.bounds.center.transform(node.globalTransform());
  },

  shift(state, input) {
    const node = state.canvas.findSelection();

    if (!node) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = this.aux.from;
    const offset = to.minus(from);

    node.translate(offset);

    this.aux.from = to;
  },

  rotate(state, input) {
    const node = state.canvas.findSelection();

    if (!node) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = this.aux.from;
    const center = this.aux.center;
    const angle = center.angle(from, to);

    node.rotate(angle, center);

    this.aux.from = to;
  },

  scale(state, input) {
    const node = state.canvas.findSelection();

    if (!node) {
      return;
    }

    const to = Vector.create(input.x, input.y);
    const from = this.aux.from;
    const center = this.aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    node.scale(factor, center);

    this.aux.from = to;
  },

  // PEN

  addSegment(state, input) {
    const shape = state.canvas.findPen() || state.canvas.appendShape();

    const spline = shape.lastChild || shape.appendSpline();
    const segment = spline.appendSegment();
    const anchor = segment.appendAnchor();

    shape.placePen();

    segment.anchor.vector = Vector
      .create(input.x, input.y)
      .transformToLocal(shape);

    anchor.placePenTip();

    this.aux.shape = shape;
    this.aux.segment = segment;
  },

  setHandles(state, input) {
    const shape = this.aux.shape;
    const segment = this.aux.segment;

    const anchor = segment.anchor;
    const inVector = Vector.create(input.x, input.y).transformToLocal(shape);
    const outVector = inVector.rotate(Math.PI, anchor.vector);

    const handleIn = segment.handleIn || segment.appendHandleIn();
    const handleOut = segment.handleOut || segment.appendHandleOut();

    handleIn.vector = inVector;
    handleOut.vector = outVector;

    handleIn.placePenTip();
  },

  initAdjustSegment(state, input) {
    const control = state.canvas.findDescendantByKey(input.key); // here, it's a node
    const shape = control.parent.parent.parent; // great
    const from = Vector.create(input.x, input.y).transformToLocal(shape);

    this.aux.from = from;
    this.aux.control = control;

    // TODO: if we want to place the pen tip, we also need the segment ...
    // but that's awkward
  },

  adjustSegment(state, input) {
    const control = this.aux.control;
    const from = this.aux.from;
    const segment = control.parent;
    const shape = segment.parent.parent;
    const to = Vector.create(input.x, input.y).transformToLocal(shape);
    const change = to.minus(from);
    control.payload.vector = control.payload.vector.add(change);

    switch (control.type) {
      case 'anchor':
        if (segment.handleIn) {
          segment.handleIn = segment.handleIn.add(change);
        }
        if (segment.handleOut) {
          segment.handleOut = segment.handleOut.add(change);
        }
        break;
      case 'handleIn':
        segment.handleOut = segment.handleIn.rotate(Math.PI, segment.anchor);
        break;
      case 'handleOut':
        segment.handleIn = segment.handleOut.rotate(Math.PI, segment.anchor);
        break;
    }

    this.aux.from = to;
  },

  // find point on curve
  projectInput(state, input) {
    const startSegment = state.canvas.findDescendantByKey(input.key);
    const spline = startSegment.parent;
    const shape = spline.parent;
    const startIndex = spline.children.indexOf(startSegment);
    const endSegment = spline.children[startIndex + 1];
    const curve = Curve.createFromSegments(startSegment, endSegment);
    const bCurve = new Bezier(...curve.coords());

    const from = Vector.create(input.x, input.y).transformToLocal(shape);
    const pointOnCurve = bCurve.project({ x: from.x, y: from.y });
    shape.splitter = Vector.createFromObject(pointOnCurve);

    this.aux.spline = spline;
    this.aux.splitter = shape.splitter;
    this.aux.startSegment = startSegment;
    this.aux.endSegment = endSegment;
    this.aux.insertionIndex = startIndex + 1;
    this.aux.bCurve = bCurve;
    this.aux.curveTime = pointOnCurve.t;
    this.aux.from = from;
  },

  splitCurve(state, input) {
    const spline = this.aux.spline;
    const newAnchor = this.aux.splitter; // careful: a vector, not a node!
    const startSegment = this.aux.startSegment;
    const endSegment = this.aux.endSegment;
    const insertionIndex = this.aux.insertionIndex;
    const bCurve = this.aux.bCurve;
    const curveTime = this.aux.curveTime;

    const splitCurves = bCurve.split(curveTime);
    const left = splitCurves.left;
    const right = splitCurves.right;
    const newSegment = Segment.create();
    newSegment.anchor = newAnchor; // a vector
    newSegment.handleIn = Vector.createFromObject(left.points[2]);
    newSegment.handleOut = Vector.createFromObject(right.points[1]);
    startSegment.handleOut = Vector.createFromObject(left.points[1]);
    endSegment.handleIn = Vector.createFromObject(right.points[2]);

    spline.insertChild(newSegment, insertionIndex);

    this.aux.control = newSegment.findDescendant(
      node => node.type === 'anchor'
    );
    this.hideSplitter(state, input);
    this.adjustSegment(state, input);
  },

  hideSplitter(state, input) {
    const segment = state.canvas.findDescendantByKey(input.key);
    const shape = segment.parent.parent;
    shape.splitter = Vector.create(-1000, -1000);
  },

  // DOCUMENT MANAGEMENT

  createDoc(state, input) {
    state.doc.replaceWith(state.buildDoc());
  },

  updateDocList(state, input) {
    state.docs.children = [];

    for (let id of input.data.docIDs) {
      const identNode = Identifier.create();
      identNode.payload._id = id;
      state.docs.append(identNode);
    }
  },

  getPrevious(state, input) {
    window.history.back(); // TODO: shouldn't we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: shouldn't we do this inside of hist?
  },

  switchDocument(state, input) {
    state.canvas.replaceWith(state.objectToDoc(input.data.doc));
    this.cleanup(state, input);
  },

  // MESSAGES

  setSavedMessage(state, input) {
    state.message.payload.text = 'Saved';
  },

  wipeMessage(state, input) {
    state.message.payload.text = '';
  },

  // EDITOR

  userChangedEditorSelection(state, input) {
    this.cleanup(state, input);

    let syntaxTreeNode;
    let sceneGraphNode;

    syntaxTreeNode = state.syntaxTree.findNodeByIndex(input.index);

    if (syntaxTreeNode) {
      sceneGraphNode = state.canvas.findDescendantByKey(syntaxTreeNode.key);
    }

    if (sceneGraphNode) {
      sceneGraphNode.select();
    }

    state.label = 'selectMode';
  },

  // => "syntaxtree to scenegraph"
  userChangedMarkup(state, input) {
    const $svg = state.markupToDOM(input.value);

    if ($svg) {
      const syntaxTree = state.domToSyntaxTree($svg);
      syntaxTree.indexify();

      state.syntaxTree = syntaxTree;
      state.canvas.replaceWith(state.domToScene($svg));
    } else {
      console.log('cannot update scenegraph and syntaxtree');
    }
  },
};

export { updates };
