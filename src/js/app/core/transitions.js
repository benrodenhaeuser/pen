// NOTE: 'type' (the event type) is mandatory. 'from', 'target' (the target type), 'to' and `do` are optional

const transitions = [
  // KICKOFF
  {
    from: 'start',
    type: 'go',
    do: 'go',
    to: 'selectMode',
  },

  // TOOLS

  // create new document
  {
    type: 'click',
    target: 'newDocButton',
    do: 'createDoc',
    to: 'selectMode',
  },

  // request stored document
  {
    type: 'click',
    target: 'doc-identifier',
    do: 'requestDoc',
  },

  // switch to select mode
  {
    type: 'click',
    target: 'selectButton',
    do: 'cleanup',
    to: 'selectMode',
  },

  // switch to pen mode
  {
    type: 'click',
    target: 'penButton',
    do: 'cleanup',
    to: 'penMode',
  },

  // trigger undo
  {
    type: 'click',
    target: 'getPrevious',
    do: 'getPrevious',
    to: 'selectMode',
  },

  // trigger redo
  {
    type: 'click',
    target: 'getNext',
    do: 'getNext',
    to: 'selectMode',
  },

  // INPUT MODES

  {
    type: 'keydown',
    target: 'esc',
    do: 'exitEdit',
  },

  // SELECT MODE

  // focus shape on hover
  {
    from: 'selectMode',
    type: 'mousemove',
    do: 'focus',
  },

  // open a group
  {
    from: 'selectMode',
    type: 'dblclick',
    target: ['shape', 'group', 'scene'],
    do: 'deepSelect',
  },

  // initiate shift transformation
  {
    from: 'selectMode',
    type: 'mousedown',
    target: ['shape', 'group', 'scene'],
    do: 'select',
    to: 'shifting',
  },

  // initate rotate transformation
  {
    from: 'selectMode',
    type: 'mousedown',
    target: 'dot',
    do: 'initTransform',
    to: 'rotating',
  },

  // initiate scale transformation
  {
    from: 'selectMode',
    type: 'mousedown',
    target: 'corner',
    do: 'initTransform',
    to: 'scaling',
  },

  // shift the shape
  {
    from: 'shifting',
    type: 'mousemove',
    do: 'shift',
  },

  // finalize shift translation
  {
    from: 'shifting',
    type: 'mouseup',
    do: 'release',
    to: 'selectMode',
  },

  // rotate the shape
  {
    from: 'rotating',
    type: 'mousemove',
    do: 'rotate',
  },

  // finalize rotate transformation
  {
    from: 'rotating',
    type: 'mouseup',
    do: 'release',
    to: 'selectMode',
  },

  // scale the shape
  {
    from: 'scaling',
    type: 'mousemove',
    do: 'scale',
  },

  // finalize scale transformation
  {
    from: 'scaling',
    type: 'mouseup',
    do: 'release',
    to: 'selectMode',
  },

  // PEN MODE

  // add segment to (current or new) shape
  {
    from: 'penMode',
    type: 'mousedown',
    target: ['shape', 'group', 'scene'],
    do: 'addSegment',
    to: 'settingHandles',
  },

  // set handles for current segment
  {
    from: 'settingHandles',
    type: 'mousemove',
    do: 'setHandles',
    to: 'settingHandles',
  },

  // finish up setting handles
  {
    from: 'settingHandles',
    type: 'mouseup',
    do: 'releasePen',
    to: 'penMode',
  },

  // initiate editing of segment
  {
    from: 'penMode',
    type: 'mousedown',
    target: 'control',
    do: 'initEditSegment',
    to: 'editingSegment',
  },

  // edit segment
  {
    from: 'editingSegment',
    type: 'mousemove',
    do: 'editSegment',
    to: 'editingSegment',
  },

  // finish up editing segment
  {
    from: 'editingSegment',
    type: 'mouseup',
    do: 'releasePen',
    to: 'penMode',
  },

  // place split point
  {
    from: 'penMode',
    type: 'mousemove',
    target: 'curve',
    do: 'projectInput',
    to: 'penMode',
  },

  // hide split point

  {
    from: 'penMode',
    type: 'mouseout',
    target: 'curve',
    do: 'hideSplitter',
    to: 'penMode',
  },

  // split curve

  {
    from: 'penMode',
    type: 'mousedown',
    target: 'curve',
    do: 'splitCurve',
    to: 'editingSegment',
  },

  // EDITOR

  // process editor input (=> from editor module)
  {
    type: 'userChangedMarkup',
    do: 'userChangedMarkup',
  },

  {
    type: 'userChangedEditorSelection',
    do: 'userChangedEditorSelection',
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

transitions.get = function(state, input) {
  const isMatch = row => {
    const from = row.from;
    const type = row.type;
    const target = row.target;

    const stateMatch = from === state.label || from === undefined;
    const typeMatch = type === input.type;
    // const targetMatch = target === input.target || target === undefined;

    const targetMatch = Array.isArray(target) && target.includes(input.target) ||
      typeof target === 'string' && target === input.target || target === undefined;

    return stateMatch && typeMatch && targetMatch;
  };

  const match = transitions.find(isMatch);

  if (match) {
    return {
      do: match.do,
      to: match.to || state.label,
    };
  }
};

export { transitions };
