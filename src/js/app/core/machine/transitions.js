import { types } from '../_.js';

// NOTE:
// mandatory: 'type', `do`
// optional: 'from', 'to', 'target', 'do'

const transitions = [
  // KICKOFF
  {
    from: { mode: 'start' },
    type: 'go',
    do: 'go',
    to: { mode: 'select', label: 'idle' },
  },

  // RESIZE
  {
    type: 'resize',
    do: 'refresh',
  },

  // TOOLS

  // create new document
  {
    type: 'click',
    target: 'newDocButton',
    do: 'createDoc',
    to: { mode: 'select', label: 'idle' },
  },

  // toggle menu view
  {
    type: 'click',
    target: 'docListButton',
    do: 'toggleMenu',
  },

  // request editor document
  {
    type: 'click',
    target: 'doc-identifier',
    do: 'requestDoc',
  },

  // select button
  {
    type: 'click',
    target: 'selectButton',
    do: 'cleanup',
    to: { mode: 'select', label: 'idle' },
  },

  // s key => switch to select
  {
    type: 'keydown',
    target: 'letterS',
    do: 'cleanup',
    to: { mode: 'select', label: 'idle' },
  },

  // pen button
  {
    type: 'click',
    target: 'penButton',
    do: 'cleanup',
    to: { mode: 'pen', label: 'idle' },
  },

  // v key => switch to pen
  {
    type: 'keydown',
    target: 'letterV',
    do: 'cleanup',
    to: { mode: 'pen', label: 'idle' },
  },

  // trigger undo
  {
    type: 'click',
    target: 'getPrevious',
    do: 'getPrevious',
    to: { mode: 'select', label: 'idle' },
  },

  // trigger redo
  {
    type: 'click',
    target: 'getNext',
    do: 'getNext',
    to: { mode: 'select', label: 'idle' },
  },

  // escape

  {
    type: 'keydown',
    target: 'esc',
    do: 'exitEdit',
  },

  // delete

  {
    type: 'keydown',
    target: 'delete',
    do: 'deleteNode',
  },

  {
    from: { mode: 'pen', label: 'idle' },
    type: 'keydown',
    target: 'letterC',
    do: 'toggleClosedStatus',
  },

  // SELECT MODE

  // focus shape on hover
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousemove',
    do: 'focus',
  },

  // open a group or shape
  {
    from: { mode: 'select', label: 'idle' },
    type: 'dblclick',
    // target: [types.SEGMENT, types.GROUP, types.CANVAS],  // unnecessary?
    do: 'deepSelect',
  },

  // initiate shift transformation
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousedown',
    target: [types.CURVE, types.SHAPE, types.GROUP, types.CANVAS],
    do: 'select',
    to: { mode: 'select', label: 'shifting' },
  },

  // initate rotate transformation
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousedown',
    target: 'dot',
    do: 'initTransform',
    to: { mode: 'select', label: 'rotating' },
  },

  // initiate scale transformation
  {
    from: { mode: 'select', label: 'idle' },
    type: 'mousedown',
    target: ['nw-corner', 'ne-corner', 'sw-corner', 'se-corner'],
    do: 'initTransform',
    to: { mode: 'select', label: 'scaling' },
  },

  // shift the shape
  {
    from: { mode: 'select', label: 'shifting' },
    type: 'mousemove',
    do: 'shift',
  },

  // finalize shift translation
  {
    from: { mode: 'select', label: 'shifting' },
    type: 'mouseup',
    do: 'release',
    to: { mode: 'select', label: 'idle' },
  },

  // rotate the shape
  {
    from: { mode: 'select', label: 'rotating' },
    type: 'mousemove',
    do: 'rotate',
  },

  // finalize rotate transformation
  {
    from: { mode: 'select', label: 'rotating' },
    type: 'mouseup',
    do: 'release',
    to: { mode: 'select', label: 'idle' },
  },

  // scale the shape
  {
    from: { mode: 'select', label: 'scaling' },
    type: 'mousemove',
    do: 'scale',
  },

  // finalize scale transformation
  {
    from: { mode: 'select', label: 'scaling' },
    type: 'mouseup',
    do: 'release',
    to: { mode: 'select', label: 'idle' },
  },

  // PEN MODE

  // add segment to (current or new) shape
  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousedown',
    target: [types.SHAPE, types.GROUP, types.CANVAS],
    do: 'addSegment',
    to: { mode: 'pen', label: 'settingHandles' },
  },

  // set handles for current segment
  {
    from: { mode: 'pen', label: 'settingHandles' },
    type: 'mousemove',
    do: 'setHandles',
  },

  // finish up setting handles
  {
    from: { mode: 'pen', label: 'settingHandles' },
    type: 'mouseup',
    do: 'releasePen', // TODO: does nothing (?)
    to: { mode: 'pen', label: 'idle' },
  },

  // initiate adjustment of segment (OR close path)
  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousedown',
    target: [types.ANCHOR, types.HANDLEIN, types.HANDLEOUT],
    do: 'initAdjustSegment',
    to: { mode: 'pen', label: 'adjustingSegment' },
  },

  // adjust segment
  {
    from: { mode: 'pen', label: 'adjustingSegment' },
    type: 'mousemove',
    do: 'adjustSegment',
  },

  // finish up adjusting segment
  {
    from: { mode: 'pen', label: 'adjustingSegment' },
    type: 'mouseup',
    do: 'releasePen', // TODO: does nothing (?)
    to: { mode: 'pen', label: 'idle' },
  },

  // place split point
  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousemove',
    target: 'curve',
    do: 'projectInput',
  },

  // hide split point

  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mouseout',
    target: 'curve',
    do: 'hideSplitter',
  },

  // split curve

  {
    from: { mode: 'pen', label: 'idle' },
    type: 'mousedown',
    target: 'curve',
    do: 'splitCurve',
    to: { mode: 'pen', label: 'adjustingSegment' },
  },

  // MARKUP

  {
    type: 'userChangedMarkup',
    do: 'userChangedMarkup',
  },

  {
    type: 'userSelectedMarkupNode',
    do: 'userSelectedMarkupNode',
  },

  // MISCELLANEOUS

  // set message to "Saved" (=> to message module)
  {
    type: 'docSaved',
    do: 'setSavedMessage',
  },

  // wipe current message (=> to message module)
  {
    type: 'wipeMessage',
    do: 'wipeMessage',
  },

  // update document list (=> to tools module)
  {
    type: 'updateDocList',
    do: 'updateDocList',
  },

  // switch to document provided (=> from db module or hist module)
  {
    type: 'switchDocument',
    do: 'switchDocument',
  },
];

// NEW
transitions.get = function(state, input) {
  const isMatch = row => {
    const from = row.from;
    const type = row.type;
    const target = row.target;

    const stateMatch =
      from === undefined ||
      (from.mode === state.mode && from.label === state.label);
    const typeMatch = type === input.type;

    const targetMatch =
      (Array.isArray(target) && target.includes(input.target)) ||
      (typeof target === 'string' && target === input.target) ||
      target === undefined;

    return stateMatch && typeMatch && targetMatch;
  };

  const match = transitions.find(isMatch);

  if (match) {
    return {
      do: match.do,
      to: match.to || { mode: state.mode, label: state.label },
    };
  }
};

// OLD
// transitions.get = function(state, input) {
//   const isMatch = row => {
//     const from = row.from;
//     const type = row.type;
//     const target = row.target;
//
//     const stateMatch = from === state.label || from === undefined;
//     const typeMatch = type === input.type;
//     // const targetMatch = target === input.target || target === undefined;
//
//     const targetMatch =
//       (Array.isArray(target) && target.includes(input.target)) ||
//       (typeof target === 'string' && target === input.target) ||
//       target === undefined;
//
//     return stateMatch && typeMatch && targetMatch;
//   };
//
//   const match = transitions.find(isMatch);
//
//   if (match) {
//     return {
//       do: match.do,
//       to: match.to || state.label,
//     };
//   }
// };

export { transitions };
