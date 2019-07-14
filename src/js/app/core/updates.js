import { Scene, Shape, Group     } from './domain.js';
import { Spline, Segment, Anchor } from './domain.js';
import { HandleIn, HandleOut     } from './domain.js';
import { Identifier, Doc         } from './domain.js';
import { Vector                  } from './domain.js';
import { Matrix                  } from './domain.js';
import { Rectangle               } from './domain.js';
import { Curve                   } from './domain.js';
import { Bezier                  } from '/vendor/bezier/bezier.js';

const updates = {
  after(state, input) {
    if (input.type !== 'markupChange') {
      // => from canvas to editor: derive syntax tree from scene
      state.syntaxTree = state.sceneToSyntaxTree();
    }
  },

  init() {
    this.aux = {};
  },

  exitEdit(state, input) {
    if (state.label === 'penMode') {
      const target = state.scene.editing;
      this.cleanup(state, input);
      target.select();
      state.label = 'selectMode';
    } else if (state.label === 'selectMode') {
      this.cleanup(state, input);
    }
  },

  select(state, input) {
    const target = state.scene.findDescendantByKey(input.key);
    const node = target && target.findAncestorByClass('frontier');

    if (node) {
      node.select();
      this.initTransform(state, input);
    } else {
      state.scene.deselectAll();
    }
  },

  release(state, input) {
    const current = state.scene.selected || state.scene.editing;

    if (current) {
      for (let ancestor of current.ancestors) {
        ancestor.updateBounds();
      }
    }

    this.aux = {};
  },

  deepSelect(state, input) {
    const target = state.scene.findDescendantByKey(input.key);

    if (!target) {
      return;
    }

    if (target.isSelected()) {
      target.edit();
      state.scene.unfocusAll();
      state.label = 'penMode';
    } else {
      const toSelect = target.findAncestor((node) => {
        return node.parent && node.parent.class.includes('frontier');
      });

      if (toSelect) {
        toSelect.select();
        state.scene.setFrontier();
        state.scene.unfocusAll();
      }
    }
  },

  focus(state, input) {
    state.scene.unfocusAll();

    const target = state.scene.findDescendantByKey(input.key);

    const hit    = Vector.create(input.x, input.y);

    if (target) {
      const toFocus = target.findAncestorByClass('frontier');

      if (toFocus && toFocus.contains(hit)) {
        toFocus.focus();
      }
    }
  },

  cleanup(state, event) {
    const current = state.scene.editing;

    if (current) {
      // update bounds of splines of current shape:
      for (let child of current.children) {
        child.updateBounds();
      }

      // update bounds of shape itself and its proper ancestors:
      for (let ancestor of current.ancestors) {
        ancestor.updateBounds();
      }
    }

    state.scene.deselectAll();
    state.scene.deeditAll();

    this.aux = {};
  },

  initTransform(state, input) {
    const node = state.scene.selected;
    this.aux.from   = Vector.create(input.x, input.y);
    this.aux.center = node.bounds.center.transform(node.globalTransform());
  },

  shift(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = this.aux.from;
    const offset = to.minus(from);

    node.translate(offset);

    this.aux.from = to;
  },

  rotate(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = this.aux.from;
    const center = this.aux.center;
    const angle  = center.angle(from, to);

    node.rotate(angle, center);

    this.aux.from = to;
  },

  scale(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = this.aux.from;
    const center = this.aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    node.scale(factor, center);

    this.aux.from = to;
  },

  addSegment(state, input) {
    let shape;
    let spline;

    if (state.scene.editing) {
      shape  = state.scene.editing;
      spline = shape.lastChild;
    } else {
      shape  = Shape.create();
      state.scene.append(shape);

      spline = Spline.create();
      shape.append(spline);

      shape.edit();
    }

    const segment = Segment.create();
    spline.append(segment);

    const anchor  = Anchor.create();
    segment.append(anchor);

    anchor.payload.vector = Vector.create(input.x, input.y).transformToLocal(shape);

    this.aux.shape   = shape;
    this.aux.segment = segment;
  },

  setHandles(state, input) {
    const shape       = this.aux.shape;
    const segment     = this.aux.segment;

    const anchor      = segment.anchor;
    const handleIn    = Vector.create(input.x, input.y).transformToLocal(shape);
    const handleOut   = handleIn.rotate(Math.PI, anchor);
    segment.handleIn  = handleIn;
    segment.handleOut = handleOut;
  },

  initEditSegment(state, input) {
    const control   = state.scene.findDescendantByKey(input.key);
    const shape     = control.parent.parent.parent;
    const from      = Vector.create(input.x, input.y).transformToLocal(shape);

    this.aux.from    = from;
    this.aux.control = control;
  },

  editSegment(state, input) {
    const control          = this.aux.control;
    const from             = this.aux.from;
    const segment          = control.parent;
    const shape            = segment.parent.parent;
    const to               = Vector.create(input.x, input.y).transformToLocal(shape);
    const change           = to.minus(from);
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

  projectInput(state, input) {
    const startSegment      = state.scene.findDescendantByKey(input.key);
    const spline            = startSegment.parent;
    const shape             = spline.parent;
    const startIndex        = spline.children.indexOf(startSegment);
    const endSegment        = spline.children[startIndex + 1];
    const curve             = Curve.createFromSegments(startSegment, endSegment);
    const bCurve            = new Bezier(...curve.coords());

    const from              = Vector.create(input.x, input.y).transformToLocal(shape);
    const pointOnCurve      = bCurve.project({ x: from.x, y: from.y });
    shape.splitter          = Vector.createFromObject(pointOnCurve);

    this.aux.spline         = spline;
    this.aux.splitter       = shape.splitter;
    this.aux.startSegment   = startSegment;
    this.aux.endSegment     = endSegment;
    this.aux.insertionIndex = startIndex + 1;
    this.aux.bCurve         = bCurve;
    this.aux.curveTime      = pointOnCurve.t;
    this.aux.from           = from;
  },

  splitCurve(state, input) {
    const spline           = this.aux.spline;
    const newAnchor        = this.aux.splitter; // careful: a vector, not a node!
    const startSegment     = this.aux.startSegment;
    const endSegment       = this.aux.endSegment;
    const insertionIndex   = this.aux.insertionIndex;
    const bCurve           = this.aux.bCurve;
    const curveTime        = this.aux.curveTime;

    const splitCurves      = bCurve.split(curveTime);
    const left             = splitCurves.left;
    const right            = splitCurves.right;
    const newSegment       = Segment.create();
    newSegment.anchor      = newAnchor;
    newSegment.handleIn    = Vector.createFromObject(left.points[2]);
    newSegment.handleOut   = Vector.createFromObject(right.points[1]);
    startSegment.handleOut = Vector.createFromObject(left.points[1]);
    endSegment.handleIn    = Vector.createFromObject(right.points[2]);

    spline.insertChild(newSegment, insertionIndex);

    this.aux.control = newSegment.findDescendant((node) => node.type === 'anchor');
    this.hideSplitter(state, input);
    this.editSegment(state, input);
  },

  hideSplitter(state, input) {
    const segment = state.scene.findDescendantByKey(input.key);
    const shape = segment.parent.parent;
    shape.splitter = Vector.create(-1000, -1000);
  },

  createDoc(state, input) {
    state.store.doc.replaceWith(state.buildDoc());
  },

  updateDocList(state, input) {
    state.store.docs.children = [];

    for (let id of input.data.docIDs) {
      const identNode = Identifier.create();
      identNode.payload._id = id;
      state.store.docs.append(identNode);
    }
  },

  setSavedMessage(state, input) {
    state.store.message.payload.text = 'Saved';
  },

  wipeMessage(state, input) {
    state.store.message.payload.text = '';
  },

  getPrevious(state, input) {
    window.history.back(); // TODO: shouldn't we do this inside of hist?
  },

  getNext(state, input) {
    window.history.forward(); // TODO: shouldn't we do this inside of hist?
  },

  switchDocument(state, input) {
    state.store.scene.replaceWith(state.objectToDoc(input.data.doc));
    this.cleanup(state, input);
  },

  // EDITOR

  // "editor to scenegraph"
  changeMarkup(state, input) {
    const $svg = state.markupToDOM(input.value);

    if ($svg) {
      const syntaxTree = state.domToSyntaxTree($svg);
      syntaxTree.indexify();

      state.syntaxTree = syntaxTree;
      state.store.scene.replaceWith(state.domToScene($svg));
    } else {
      const scene = Scene.create();
      scene.viewBox = Rectangle.createFromDimensions(0, 0, 600, 395);
      state.store.scene.replaceWith(scene);
      // TODO: at this point, editor and scene are potentially out of sync.
    }
  },

  selectFromEditor(state, input) {
    this.cleanup(state, input);

    let syntaxTreeNode;
    let sceneGraphNode;

    syntaxTreeNode = state.syntaxTree.findNodeByIndex(input.index);

    if (syntaxTreeNode) {
      sceneGraphNode = state.store.scene.findDescendantByKey(syntaxTreeNode.key);
    }

    if (sceneGraphNode) {
      sceneGraphNode.select();
    }

    state.label = 'selectMode';
  },
};

export { updates };
