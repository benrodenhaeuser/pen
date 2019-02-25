// 'type' is mandatory
// 'from', 'target', 'to' and `do` are optional

const config = [
  { from: 'start', type: 'kickoff', do: 'kickoff', to: 'idle' },
  { from: 'idle', type: 'mousemove', do: 'focus' },
  { from: 'idle', type: 'dblclick', target: 'wrapper', do: 'selectThrough' },
  { from: 'idle', type: 'mousedown', target: 'wrapper', do: 'select', to: 'shifting' },
  { from: 'idle', type: 'mousedown', target: 'root', do: 'deselect' },
  { from: 'shifting', type: 'mousemove', do: 'shift' },
  { from: 'shifting', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'mousedown', target: 'dot', do: 'initRotate', to: 'rotating' },
  { from: 'rotating', type: 'mousemove', do: 'rotate' },
  { from: 'rotating', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'mousedown', target: 'corner', do: 'initScale', to: 'scaling' },
  { from: 'scaling', type: 'mousemove', do: 'scale' },
  { from: 'scaling', type: 'mouseup', do: 'release', to: 'idle' },
  { from: 'idle', type: 'click', target: 'usePen', do: 'deselect', to: 'pen' },
  { from: 'pen', type: 'mousedown', do: 'initPen' },
  { type: 'click', target: 'doc-list-entry', do: 'requestDoc' },
  { type: 'docSaved' },
  { type: 'updateDocList', do: 'updateDocList' },
  { type: 'requestDoc', do: 'requestDoc', to: 'busy' },
  { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },
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
    return {
      do: match.do,
      to: match.to || state.id,
    };
  }
};

export { config };
