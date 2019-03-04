import { Matrix } from '../domain/matrix.js';
import { Vector } from '../domain/vector.js';

let aux = {};

const actions = {
  select(state, input) {
    const toSelect = state.scene
      .findDescendant((node) => {
        return node._id === input.pointer.targetID;
      })
      .findAncestor((node) => {
        return node.props.class.includes('frontier');
      });

    if (toSelect) {
      toSelect.select();
      aux.source = Vector.create(input.pointer.x, input.pointer.y);;
    } else {
      state.scene.deselectAll();
    }
  },

  shift(state, input) {
    const selected = state.scene.selected;

    if (!selected) { return; }

    const target      = Vector.create(input.pointer.x, input.pointer.y);
    const translate   = target.subtract(aux.source);
    const translation = Matrix.translation(translate);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(translation)
      .multiply(selected.globalTransform());

    aux.source = target;
  },

  initRotate(state, input) {
    const selected = state.scene.selected;
    aux.source     = Vector.create(input.pointer.x, input.pointer.y);
    const box      = selected.box;
    const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
    aux.center     = center.transform(selected.globalTransform());
  },

  rotate(state, input) {
    const selected          = state.scene.selected;
    const target            = Vector.create(input.pointer.x, input.pointer.y);
    const sourceMinusCenter = aux.source.subtract(aux.center);
    const targetMinusCenter = target.subtract(aux.center);

    const sourceAngle = Math.atan2(sourceMinusCenter.y, sourceMinusCenter.x);
    const targetAngle = Math.atan2(targetMinusCenter.y, targetMinusCenter.x);
    const angle       = targetAngle - sourceAngle;
    const rotation    = Matrix.rotation(angle, aux.center);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(rotation)
      .multiply(selected.globalTransform());

    aux.source = target;
  },

  initScale(state, input) {
    const selected = state.scene.selected;
    aux.source     = Vector.create(input.pointer.x, input.pointer.y);
    const box      = selected.box;
    const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
    aux.center     = center.transform(selected.globalTransform());
  },

  scale(state, input) {
    const selected          = state.scene.selected;
    const target            = Vector.create(input.pointer.x, input.pointer.y);
    const sourceMinusCenter = aux.source.subtract(aux.center);
    const targetMinusCenter = target.subtract(aux.center);

    const sourceDistance = Math.sqrt(
      Math.pow(sourceMinusCenter.x, 2) +
      Math.pow(sourceMinusCenter.y, 2)
    );
    const targetDistance = Math.sqrt(
      Math.pow(targetMinusCenter.x, 2) +
      Math.pow(targetMinusCenter.y, 2)
    );
    const factor     = targetDistance / sourceDistance;
    const scaling    = Matrix.scale(factor, aux.center);

    selected.transform = selected
      .ancestorTransform().invert()
      .multiply(scaling)
      .multiply(selected.globalTransform());

    aux.source = target;
  },

  release(state, input) {
    const selected = state.scene.selected;

    for (let ancestor of selected.ancestors) {
      ancestor.updateBBox();
    }

    aux = {};
  },

  deepSelect(state, input) {
    const target = state.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    if (target.isSelected()) {
      target.edit();
      state.scene.unfocusAll();
      // state.id = 'pen'; // hack!
    } else {
      const toSelect = target.findAncestor((node) => {
        return node.parent && node.parent.props.class.includes('frontier');
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

    const target = state.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    if (target) {
      const toFocus = target.findAncestor((node) => {
        return node.classList.includes('frontier');
      });

      if (toFocus) {
        const pointer = Vector
          .create(input.pointer.x, input.pointer.y)
          .transform(toFocus.globalTransform().invert());

        if (pointer.isWithin(toFocus.box)) {
          toFocus.focus();
        }
      }
    }
  },

  deselect(state, event) {
    state.scene.deselectAll();
  },

  // OLD (partially useless?):

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

  // Pen tool

  initPen(state, event) {
    console.log('starting to draw with pen');
  },


};

export { actions };
