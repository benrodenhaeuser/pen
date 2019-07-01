// NOTE: 'type' is mandatory. 'from', 'target', 'to' and `do` are optional

const transitions = [
  // KICKOFF
  {
    from: 'start',
    type: 'go',
    do: 'go',
    to: 'selectMode'
  },

  // TOOLS PALETTE

  // create a new document
  {
    type: 'click',
    target: 'newDocButton',
    do: 'createDoc',
    to: 'selectMode'
  },

  // request document
  {
    type: 'click',
    target: 'doc-identifier',
    do: 'requestDoc',
  },

  // activate select mode
  {
    type: 'click',
    target: 'selectButton',
    do: 'clean',
    to: 'selectMode'
  },

  // activate pen mode
  {
    type: 'click',
    target: 'penButton',
    do: 'clean',
    to: 'penMode'
  },

  // undo action
  {
    type: 'click',
    target: 'getPrevious',
    do: 'getPrevious',
    to: 'selectMode'
  },

  // redo action
  {
    type: 'click',
    target: 'getNext',
    do: 'getNext',
    to: 'selectMode'
  },

  // SELECT MODE

  // focus a shape when hovering
  {
    from: 'selectMode',
    type: 'mousemove',
    do: 'focus'
  },

  // click through a group
  {
    from: 'selectMode',
    type: 'dblclick',
    target: 'content',
    do: 'deepSelect'
  },

  // initiate shift transformation
  {
    from: 'selectMode',
    type: 'mousedown',
    target: 'content',
    do: 'select',
    to: 'shifting'
  },

  // initate rotate transformation
  {
    from: 'selectMode',
    type: 'mousedown',
    target: 'dot',
    do: 'initTransform',
    to: 'rotating'
  },

  // initiate scale transformation
  {
    from: 'selectMode',
    type: 'mousedown',
    target: 'corner',
    do: 'initTransform',
    to: 'scaling'
  },

  // shift the shape
  {
    from: 'shifting',
    type: 'mousemove',
    do: 'shift'
  },

  // finalize shift translation
  {
    from: 'shifting',
    type: 'mouseup',
    do: 'release',
    to: 'selectMode'
  },

  // rotate the shape
  {
    from: 'rotating',
    type: 'mousemove',
    do: 'rotate'
  },

  // finalize rotate transformation
  {
    from: 'rotating',
    type: 'mouseup',
    do: 'release',
    to: 'selectMode'
  },

  // scale the shape
  {
    from: 'scaling',
    type: 'mousemove',
    do: 'scale'
  },

  // finalize scale transformation
  {
    from: 'scaling',
    type: 'mouseup',
    do: 'release',
    to: 'selectMode'
  },

  // PEN MODE

  // create shape (with initial anchor)
  {
    from: 'penMode',
    type: 'mousedown',
    target: 'content',
    do: 'createShape',
    to: 'settingHandles'
  },

  // set handles for current shape segment
  {
    from: 'settingHandles',
    type: 'mousemove',
    do: 'setHandles',
    to: 'settingHandles'
  },

  // finish up setting handles
  {
    from: 'settingHandles',
    type: 'mouseup',
    do: 'releasePen',
    to: 'expandingShape'
  },

  // add segment to current shape
  {
    from: 'expandingShape',
    type: 'mousedown',
    target: 'content',
    do: 'addSegment',
    to: 'settingHandles'
  },

  // initiate edit of control (anchor or handle) of current shape (TODO)
  // TODO: could unify with next transition?
  {
    from: 'expandingShape',
    type: 'mousedown',
    target: 'control',
    do: 'pickControl',
    to: 'editingControl'
  },

  // initiate edit of control (anchor or handle) of current shape (TODO)
  {
    from: 'penMode',
    type: 'mousedown',
    target: 'control',
    do: 'pickControl',
    to: 'editingControl'
  },

  // move control of current shape (TODO)
  {
    from: 'editingControl',
    type: 'mousemove',
    do: 'moveControl',
    to: 'editingControl'
  },

  // finish editing control of current shape (TODO)
  {
    from: 'editingControl',
    type: 'mouseup',
    do: 'releasePen',
    to: 'penMode'
  },

  // MISCELLANEOUS

  // initiate display of saved message (to message module)
  {
    type: 'docSaved',
    do: 'setSavedMessage'
  },

  // wipe current message displayed to user (to message module)
  {
    type: 'wipeMessage',
    do: 'wipeMessage'
  },

  // update document list (to tools module)
  {
    type: 'updateDocList',
    do: 'updateDocList'
  },

  // switch to document provided as input (from db module or hist module)
  {
    type: 'switchDocument',
    do: 'switchDocument',
  },

  // user has typed something in editor (from editor module)
  {
    type: 'input',
    do: 'changeMarkup'
  },
];

transitions.get = function(state, input) {
  const isMatch = (row) => {
    const from   = row.from;
    const type   = row.type;
    const target = row.target;

    const stateMatch  = from === state.label || from === undefined;
    const typeMatch   = type === input.type;
    const targetMatch = target === input.target || target === undefined;

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
