const transitionMap = [
  [{ stateLabel: 'start', input: 'kickoff' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'idle', input: 'createShape' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'idle', input: 'createProject' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'idle', input: 'projectSaved' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'idle', input: 'startAnimation' }, { nextLabel: 'animating' }],
  [{ stateLabel: 'idle', input: 'getFrameOrigin' }, { nextLabel: 'draggingFrame' }],
  [{ stateLabel: 'idle', input: 'resizeFrame' }, { nextLabel: 'resizingFrame' }],
  [{ stateLabel: 'idle', input: 'setFrameOrigin' }, { nextLabel: 'drawingFrame' }],
  [{ stateLabel: 'idle', input: 'deleteFrame' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'idle', input: 'updateDocList' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'idle', input: 'setDocId' }, { nextLabel: 'loading' }],
  [
    { stateLabel: 'drawingFrame', input: 'changeCoordinates' },
    { action: 'sizeFrame', nextLabel: 'drawingFrame' }
  ],
  [{ stateLabel: 'drawingFrame', input: 'releaseFrame' }, { nextLabel: 'idle' }],
  [
    { stateLabel: 'drawingFrame', input: 'projectSaved' },
    { nextLabel: 'drawingFrame' }
  ],
  [
    { stateLabel: 'draggingFrame', input: 'changeCoordinates' },
    { action: 'moveFrame', nextLabel: 'draggingFrame' }
  ],
  [{ stateLabel: 'draggingFrame', input: 'releaseFrame' }, { nextLabel: 'idle' }],
  [
    { stateLabel: 'draggingFrame', input: 'projectSaved' },
    { nextLabel: 'draggingFrame' }
  ],
  [
    { stateLabel: 'resizingFrame', input: 'changeCoordinates' },
    { action: 'sizeFrame', nextLabel: 'resizingFrame' }
  ],
  [{ stateLabel: 'resizingFrame', input: 'releaseFrame' }, { nextLabel: 'idle' }],
  [
    { stateLabel: 'resizingFrame', input: 'projectSaved' },
    { nextLabel: 'resizingFrame' }
  ],
  [{ stateLabel: 'animating', input: 'startAnimation' }, { nextLabel: 'animating' }],
  [{ stateLabel: 'animating', input: 'toIdle' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'animating', input: 'createProject' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'animating', input: 'createShape' }, { nextLabel: 'idle' }],
  [{ stateLabel: 'loading', input: 'setDoc' }, { nextLabel: 'idle' }],
];

transitionMap.get = function(key) {
  const match = (pair) => {
    return pair[0].stateLabel === key[0] &&
      pair[0].input === key[1];
  };

  const pair = transitionMap.find(match);

  if (pair) {
    return pair[1]; // returns an object
  }
};

export { transitionMap };
