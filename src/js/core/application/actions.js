import { Scene, Shape, Group     } from './domain/types.js';
import { Spline, Segment, Anchor } from './domain/types.js';
import { HandleIn, HandleOut,    } from './domain/types.js';

import { Vector                  } from './domain/vector.js';
import { Matrix                  } from './domain/matrix.js';
import { Rectangle               } from './domain/rectangle.js';

let aux = {};

const actions = {
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

  initTransform(state, input) {
    const node = state.scene.selected;
    aux.from   = Vector.create(input.x, input.y); // global coordinates
    aux.center = node.bounds.center.transform(node.globalTransform());
    // ^ global coordinates (globalTransform transforms local coords to global coords)
  },

  shift(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y); // global coordinates
    const from   = aux.from;
    const offset = to.minus(from);

    node.translate(offset);

    aux.from = to;
  },

  rotate(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = aux.from;
    const center = aux.center;
    const angle  = center.angle(from, to);

    node.rotate(angle, center);

    aux.from = to;
  },

  scale(state, input) {
    const node = state.scene.selected;

    if (!node) {
      return;
    }

    const to     = Vector.create(input.x, input.y);
    const from   = aux.from;
    const center = aux.center;
    const factor = to.minus(center).length() / from.minus(center).length();

    node.scale(factor, center);

    aux.from = to;
  },

  release(state, input) {
    const current = state.scene.selected || state.scene.editing;

    if (current) {
      for (let ancestor of current.ancestors) {
        ancestor.memoizeBounds();
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
      state.label = 'pen'; // TODO: hack! could the action initiate an input?
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
    state.scene.unfocusAll(); // expensive but effective

    const target = state.scene.findDescendantByKey(input.key);
    const hit    = Vector.create(input.x, input.y);

    if (target) {
      const toFocus = target.findAncestorByClass('frontier');

      if (toFocus && toFocus.contains(hit)) {
        toFocus.focus();
      }
    }
  },

  deselect(state, event) {
    state.scene.deselectAll();
  },

  deedit(state, event) {
    state.scene.deeditAll();
  },

  // OLD (still useful?):

  createDoc(state, input) {
    state.init(); // TODO: want a new state here!
    state.docs.ids.push(state.doc._id);
    state.docs.selectedID = state._id;
  },

  updateDocList(state, input) {
    // state.docs.ids = input.data.docIDs;
    // ^ old code, does not work anymore
  },

  requestDoc(state, input) {
    state.docs.selectedID = input.key;
  },

  setDoc(state, input) {
    state.init(input.data.doc);
  },

  // PEN TOOL (draft version)

  // mousedown in state 'pen'
  // ==> make a new shape/spline and place an anchor
  addFirstAnchor(state, input) {       // FIXED
    const shape   = Shape.create();
    const spline  = Spline.create();
    const segment = Segment.create();
    const anchor  = Anchor.create();

    shape.append(spline);
    spline.append(segment);
    segment.append(anchor);
    state.scene.append(shape);

    anchor.payload.vector = Vector.create(input.x, input.y);
    shape.edit();
    shape.payload.bounds = Rectangle.create(); // TODO: hack

    aux.spline = spline;
    aux.segment = segment;
  },

  // mousemove in state 'addingHandle'
  // ==> add handleIn and handleOut to existing segment
  addHandle(state, input) {   // FIX
    const segment = aux.segment;
    const anchor  = segment.anchor;

    const handleIn = Vector.create(input.x, input.y);
    const handleOut = handleIn.rotate(Math.PI, anchor);

    segment.handleIn = handleIn;
    segment.handleOut = handleOut;
  },

  // mousedown on state 'continuePen'
  // ==> add another segment with anchor to shape/spline
  addSegment(state, input) {   // FIX
    const spline = aux.spline;
    const segment = Segment.create();
    const anchor = Anchor.create();
    anchor.payload.vector = Vector.create(input.x, input.y);
    segment.append(anchor);
    spline.append(segment);

    aux.segment = segment;
  },

  editControl(state, input) {
    console.log('initiating edit of control point'); // fine
    // identify the control by its id
    // ... store it
  },

  moveControl(state, input) {
    console.log('supposed to be moving control point'); // fine
    // retrieve stored control
    // ... move it
  },
};

export { actions };
