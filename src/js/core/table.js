const table = [
  {
    from: 'start',
    input: { type: 'kickoff' },
    do: 'kickoff',
    to: 'idle',
  },

  {
    from: 'idle',
    input: { type: 'mousemove' },
    do: 'focus',
    to: 'idle',
  },

  {
    from: 'idle',
    input: { type: 'dblclick', target: 'wrapper' },
    do: 'selectThrough',
    to: 'idle',
  },

  {
    from: 'idle',
    input: { type: 'mousedown', target: 'wrapper'},
    do: 'select',
    to: 'shifting',  // move
  },

  {
    from: 'shifting', // move
    input: { type: 'mousemove' },
    do: 'shift', // move
    to: 'shifting',
  },

  {
    from: 'shifting',
    input: { type: 'mouseup' },
    do: 'release',
    to: 'idle',
  },

  {
    from: 'idle',
    input: { type: 'mousedown', target: 'dot' },
    do: 'initRotate',
    to: 'rotating',
  },

  {
    from: 'rotating',
    input: { type: 'mousemove' },
    do: 'rotate',
    to: 'rotating',
  },

  {
    from: 'rotating',
    input: { type: 'mouseup' },
    do: 'release',
    to: 'idle',
  },

  {
    from: 'idle',
    input: { type: 'mousedown', target: 'corner' },
    do: 'initScale',
    to: 'scaling',
  },

  {
    from: 'scaling',
    input: { type: 'mousemove' },
    do: 'scale',
    to: 'scaling',
  },

  {
    from: 'scaling',
    input: { type: 'mouseup' },
    do: 'release',
    to: 'idle',
  },

  // OLD (but in new format!)

  {
    input: { type: 'click', target: 'doc-list-entry' },
    do: 'requestDoc',
  },

  {
    input: { type: 'docSaved' },
    do: 'docSaved',
  },

  {
    input: { type: 'updateDocList' },
    do: 'updateDocList',
  },

  {
    input: { type: 'requestDoc' },
    do: 'requestDoc',
    to: 'busy'
  },

  {
    from: 'busy',
    input: { type: 'setDoc' },
    do: 'setDoc',
    to: 'idle',
  },
];

table.get = function(state, input) {
  const isMatch = (row) => {
    const from   = row.from;
    const type   = row.input.type;
    const target = row.input.target;

    const stateMatch  = from === state.id || from === undefined;
    const typeMatch   = type === input.type;
    const targetMatch = target === input.target || target === undefined;

    return stateMatch && typeMatch && targetMatch;
  };

  const match = table.find(isMatch);

  if (match) {
    return {
      do: match.do,
      to: match.to || state.id,
    };
  }
};

export { table };
