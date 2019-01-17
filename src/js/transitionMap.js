const transitionMap = [
  [
    { stateLabel: 'start', input: 'kickoff' },
    { action: 'skip', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'createShape' },
    { action: 'createShape', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'createProject' },
    { action: 'createProject', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'projectSaved' },
    { action: 'skip', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'startAnimation' },
    { action: 'skip', nextLabel: 'animating' }
  ],
  [
    { stateLabel: 'idle', input: 'modifyPosition' },
    { action: 'grabFrame', nextLabel: 'draggingFrame' }
  ],
  [
    { stateLabel: 'idle', input: 'resizeFrame' },
    { action: 'grabCorner', nextLabel: 'resizingFrame' }
  ],
  [
    { stateLabel: 'idle', input: 'createFrame' },
    { action: 'setFrameOrigin', nextLabel: 'drawingFrame' }
  ],
  [
    { stateLabel: 'idle', input: 'deleteFrame' },
    { action: 'deleteFrame', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'projecSaved' },
    { action: 'skip', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'projectIdsLoaded' },
    { action: 'processProjectIds', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'drawingFrame', input: 'changeCoordinates' },
    { action: 'sizeFrame', nextLabel: 'drawingFrame' }
  ],
  [
    { stateLabel: 'drawingFrame', input: 'releaseFrame' },
    { action: 'clear', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'draggingFrame', input: 'changeCoordinates' },
    { action: 'moveFrame', nextLabel: 'draggingFrame' }
  ],
  [
    { stateLabel: 'draggingFrame', input: 'releaseFrame' },
    { action: 'clear', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'resizingFrame', input: 'changeCoordinates' },
    { action: 'sizeFrame', nextLabel: 'resizingFrame' }
  ],
  [
    { stateLabel: 'resizingFrame', input: 'releaseFrame' },
    { action: 'clear', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'animating', input: 'startAnimation' },
    { action: 'skip', nextLabel: 'animating' }
  ],
  [
    { stateLabel: 'animating', input: 'toIdle' },
    { action: 'skip', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'animating', input: 'createProject' },
    { action: 'createProject', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'animating', input: 'createShape' },
    { action: 'createShape', nextLabel: 'idle' }
  ]
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
