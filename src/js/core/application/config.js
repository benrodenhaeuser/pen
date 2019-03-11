// 'type' is mandatory
// 'from', 'target', 'to' and `do` are optional

const config = [
  { from: 'start', type: 'kickoff', do: 'kickoff', to: 'idle' },
  { from: 'idle', type: 'mousemove', do: 'focus' },
  { from: 'idle', type: 'dblclick', target: 'content', do: 'deepSelect' },
  { from: 'idle', type: 'mousedown', target: 'content', do: 'select', to: 'shifting' },
  { from: 'idle', type: 'mousedown', target: 'root', do: 'deselect' },
  { from: 'shifting', type: 'mousemove', do: 'shift' },
  { from: 'shifting', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'mousedown', target: 'dot', do: 'initTransform', to: 'rotating' },
  { from: 'rotating', type: 'mousemove', do: 'rotate' },
  { from: 'rotating', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'mousedown', target: 'corner', do: 'initTransform', to: 'scaling' },
  { from: 'scaling', type: 'mousemove', do: 'scale' },
  { from: 'scaling', type: 'mouseup', do: 'release', to: 'idle' },
  { type: 'click', target: 'doc-list-entry', do: 'requestDoc' },
  { type: 'docSaved' },
  { type: 'updateDocList', do: 'updateDocList' },
  { type: 'requestDoc', do: 'requestDoc', to: 'busy' },
  { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },
  // PEN TOOL
  // adding controls
  { from: 'idle', type: 'click', target: 'activatePen', do: 'deselect', to: 'pen' },
  { from: 'pen', type: 'mousedown', target: 'content', do: 'addFirstAnchor', to: 'addingHandle' },
  { from: 'addingHandle', type: 'mousemove', do: 'addHandle', to: 'addingHandle' },
  { from: 'addingHandle', type: 'mouseup', to: 'continuePen' },
  { from: 'continuePen', type: 'mousedown', target: 'content', do: 'addSegment', to: 'addingHandle' },
  // editing controls
  { from: 'continuePen', type: 'mousedown', target: 'control', do: 'editControl', to: 'editingControl' },
  { from: 'pen', type: 'mousedown', target: 'control', do: 'editControl', to: 'editingControl' },
  { from: 'editingControl', type: 'mousemove', do: 'moveControl', to: 'editingControl' },
  { from: 'editingControl', type: 'mouseup', to: 'pen' },
];

config.get = function(state, input) {
  const isMatch = (row) => {
    const from   = row.from;
    const type   = row.type;
    const target = row.target;

    const stateMatch  = from === state.id || from === undefined;
    const typeMatch   = type === input.type;
    const targetMatch = target === input.target || target === undefined;

    return stateMatch && typeMatch && targetMatch;
  };

  const match = config.find(isMatch);

  if (match) {
    // console.log(input.target); // note that inputs from db don't have a target
    return {
      do: match.do,
      to: match.to || state.id,
    };
  }
};

export { config };
