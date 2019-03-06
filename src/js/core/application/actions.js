import { Vector }  from '../domain/vector.js';
import { Shape, Group, Root } from '../domain/node.js';
import { Path }    from '../domain/path.js';
import { Segment } from '../domain/segment.js';

let aux = {};

const actions = {
  select(state, input) {
    const target   = state.scene.findByID(input.pointer.targetID);
    const toSelect = target && target.findAncestor((node) => {
      return node.class.includes('frontier');
    });

    if (toSelect) {
      toSelect.select();
      this.initTransform(state, input);
    } else {
      state.scene.deselectAll();
    }
  },

  initTransform(state, input) {
    const selected = state.scene.selected;
    aux.from       = Vector.create(input.pointer.x, input.pointer.y);
    aux.center     = selected.box.center.transform(selected.globalTransform());
  },

  shift(state, input) {
    const selected = state.scene.selected;

    if (!selected) {
      return;
    }

    const to   = Vector.create(input.pointer.x, input.pointer.y);
    const from = aux.from;

    selected.translate(to.subtract(from));

    aux.from = to;
  },

  rotate(state, input) {
    const to     = Vector.create(input.pointer.x, input.pointer.y);
    const from   = aux.from;
    const center = aux.center;

    state.scene.selected.rotate(
      to.subtract(center).angle() - from.subtract(center).angle(),
      center
    );

    aux.from = to;
  },

  scale(state, input) {
    const to     = Vector.create(input.pointer.x, input.pointer.y);
    const from   = aux.from;
    const center = aux.center;

    state.scene.selected.scale(
      to.subtract(center).length() / from.subtract(center).length(),
      center
   );

    aux.from = to;
  },

  release(state, input) {
    for (let ancestor of state.scene.selected.ancestors) {
      ancestor.updateBBox();
    }

    aux = {};
  },

  deepSelect(state, input) {
    const target = state.scene.findByID(input.pointer.targetID);

    if (!target) {
      return;
    }

    if (target.isSelected()) {
      target.edit();
      state.scene.unfocusAll();
      state.id = 'pen'; // TODO: hack!
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

    const target = state.scene.findByID(input.pointer.targetID);

    if (target) {
      const toFocus = target.findAncestor((node) => {
        return node.class.includes('frontier');
      });

      if (toFocus) {
        // const point = Vector.create(input.pointer.x, input.pointer.y);
        // if (toFocus.contains(point)) {
        //   toFocus.focus();
        // }

        const point = Vector
          .create(input.pointer.x, input.pointer.y)
          .transform(toFocus.globalTransform().invert());

        if (point.isWithin(toFocus.box)) {
          toFocus.focus();
        }
      }
    }
  },

  deselect(state, event) {
    state.scene.deselectAll();
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
    state.docs.selectedID = input.pointer.targetID;
  },

  setDoc(state, input) {
    state.init(input.data.doc);
  },

  // pen tool

  // mousedown in state 'pen'
  initPen(state, input) {
    const node = Shape.create();
    const d = `M ${input.pointer.x} ${input.pointer.y}`;
    node.path = Path.createFromSVGpath(d);
    node.type = 'shape';
    state.scene.append(node);
    node.edit();

    aux.node = node;
  },

  addSegment(state, input) {
    const node = aux.node;
    console.log(node.path);
    const anchor = Vector.create(input.pointer.x, input.pointer.y);
    const segment = Segment.create({ anchor: anchor });
    node.path.splines[0].segments.push(segment);
    console.log(node.path);

    console.log(state);

    // TODO: the line lacks a stroke
  },
};

export { actions };
