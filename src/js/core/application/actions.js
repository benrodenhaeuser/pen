import { Shape   } from '../domain/node.js';
import { Group   } from '../domain/node.js';
import { Root    } from '../domain/node.js';
import { Vector  } from '../domain/vector.js';
import { Path    } from '../domain/path.js';
import { Segment } from '../domain/segment.js';
import { Matrix  } from '../domain/matrix.js';

let aux = {};

const touch = (node) => {
  if (node) {
    node._id = createID();
  }

  return node;
};

// usually, it's very clear what node we are going to change.
// so touch implements that.

const actions = {
  select(state, input) {
    const target = state.scene.findDescendantByID(input.targetID);
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
        ancestor.updateBounds();
      }
    }

    this.aux = {};
  },

  deepSelect(state, input) {
    const target = state.scene.findDescendantByID(input.targetID);

    if (!target) {
      return;
    }

    if (target.isSelected()) {
      target.edit();
      state.scene.unfocusAll();
      state.id = 'pen'; // TODO: hack! could the action initiate an input?
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

    const target = state.scene.findDescendantByID(input.targetID);
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
    state.init();
    state.docs.ids.push(state.doc._id);
    state.docs.selectedID = state._id;
  },

  updateDocList(state, input) {
    state.docs.ids = input.data.docIDs;
  },

  requestDoc(state, input) {
    state.docs.selectedID = input.targetID;
  },

  setDoc(state, input) {
    state.init(input.data.doc);
  },

  // PEN TOOL (draft version)

  // work on a proper API for manipulating paths

  // mousedown in state 'pen':
  addFirstAnchor(state, input) {
    const node = Shape.create();
    const d = `M ${input.x} ${input.y}`;
    node.path = Path.createFromSVGpath(d); // assignment to path
    node.type = 'shape';
    state.scene.append(node);
    node.edit();

    aux.node = node;
  },

  // mousemove in state 'addingHandle'
  addHandle(state, input) {
    const node = aux.node;
    const length = node.path.splines[0].segments.length;
    const segment = node.path.splines[0].segments[length - 1];
    const anchor = segment.anchor;
    const handleIn = Vector.create(input.x, input.y);
    const handleOut = handleIn.transform(Matrix.rotation(Math.PI, anchor));
    segment.handleIn = Vector.create(input.x, input.y);
    segment.handleOut = handleOut;
  },

  // mousedown on state 'continuePen'
  addSegment(state, input) {
    const node = aux.node;
    // console.log(node.path);
    const anchor = Vector.create(input.x, input.y);
    const segment = Segment.create({ anchor: anchor });
    node.path.splines[0].segments.push(segment);
    console.log(node.path);
  },

  editControl(state, input) {
    console.log('initiating edit of control point'); // fine
    // identify the control by its id (currently undefined)
    // ... store it
  },

  moveControl(state, input) {
    console.log('supposed to be moving control point'); // fine
    // retrieve stored control
    // ... move it
  },
};

export { actions };
