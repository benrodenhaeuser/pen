// 'type' is mandatory
// 'from', 'target', 'to' and `do` are optional

const transitions = [
  { from: 'start', type: 'go', do: 'go', to: 'idle' },
  { from: 'idle', type: 'mousemove', do: 'focus' },
  { type: 'cleanMessage', do: 'cleanMessage' },

  // SELECT
  { type: 'click', target: 'select', do: 'deedit', to: 'idle' },
  { from: 'idle', type: 'dblclick', target: 'content', do: 'deepSelect' },
  { from: 'idle', type: 'mousedown', target: 'content', do: 'select', to: 'shifting' },

  // TRANSFORM
  { from: 'shifting', type: 'mousemove', do: 'shift' },
  { from: 'shifting', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'mousedown', target: 'dot', do: 'initTransform', to: 'rotating' },
  { from: 'rotating', type: 'mousemove', do: 'rotate' },
  { from: 'rotating', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'mousedown', target: 'corner', do: 'initTransform', to: 'scaling' },
  { from: 'scaling', type: 'mousemove', do: 'scale' },
  { from: 'scaling', type: 'mouseup', do: 'release', to: 'idle' },

  // PEN
  { from: 'idle', type: 'click', target: 'pen', do: 'deselect', to: 'pen' },
  // adding controls
  { from: 'pen', type: 'mousedown', target: 'content', do: 'placeAnchor', to: 'addingHandle' },
  { from: 'addingHandle', type: 'mousemove', do: 'addHandles', to: 'addingHandle' },
  { from: 'addingHandle', type: 'mouseup', do: 'releasePen', to: 'continuePen' },
  { from: 'continuePen', type: 'mousedown', target: 'content', do: 'addSegment', to: 'addingHandle' },
  // editing controls
  { from: 'continuePen', type: 'mousedown', target: 'control', do: 'pickControl', to: 'editingControl' },
  { from: 'pen', type: 'mousedown', target: 'control', do: 'pickControl', to: 'editingControl' },
  { from: 'editingControl', type: 'mousemove', do: 'moveControl', to: 'editingControl' },
  { from: 'editingControl', type: 'mouseup', do: 'releasePen', to: 'pen' }, 

  // VARIOUS
  { type: 'click', target: 'doc-identifier', do: 'requestDoc', to: 'busy' },
  { type: 'click', target: 'newDocButton', do: 'createDoc', to: 'idle' },
  { type: 'click', target: 'getPrevious', do: 'getPrevious', to: 'idle' },
  { type: 'click', target: 'getNext', do: 'getNext', to: 'idle' },
  { type: 'changeState', do: 'changeState' },
  { type: 'docSaved', do: 'setSavedMessage' },
  { type: 'updateDocList', do: 'updateDocList' },
  { type: 'requestDoc', do: 'requestDoc', to: 'busy' }, // TODO: redundant?
  { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },

  // INPUT
  { type: 'input', do: 'changeMarkup' },
  // { type: 'submit', do: 'submitChanges' }
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
