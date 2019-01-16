const transitionMap = [
  [
    { stateLabel: 'start', input: 'kickoff' },
    { action: 'skip', messages: { db: 'loadProjectIds' }, nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'createShape' },
    { action: 'createShape', messages: { ui: 'renderFrames' }, nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'createProject' },
    {
      action: 'createProject',
      messages: { db: 'saveNewProject', ui: 'renderFrames' },
      nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'projectSaved' },
    {
      action: 'skip',
      messages: { ui: 'displaySavedNewFlash' },
      nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'startAnimation' },
    { action: 'skip', messages: { ui: 'animateShapes' }, nextLabel: 'animating' }
  ],
  [
    { stateLabel: 'idle', input: 'modifyPosition' },
    {
      action: 'grabFrame',
      messages: { ui: 'renderFrames' },
      nextLabel: 'draggingFrame'
    }
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
    { action: 'deleteFrame', messages: { ui: 'renderFrames' }, nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'idle', input: 'projecSaved' },
    {
      action: 'skip',
      messages: { ui: 'displaySavedNewFlash' },
      nextLabel: 'idle'
    }
  ],
  [
    { stateLabel: 'idle', input: 'projectIdsLoaded' },
    {
      action: 'processProjectIds',
      messages: { ui: 'renderProjectIds' },
      nextLabel: 'idle'
    }
  ],
  [
    { stateLabel: 'drawingFrame', input: 'changeCoordinates' },
    {
      action: 'sizeFrame',
      messages: { ui: 'renderFrames' },
      nextLabel: 'drawingFrame'
    }
  ],
  [
    { stateLabel: 'drawingFrame', input: 'releaseFrame' },
    { action: 'clear', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'draggingFrame', input: 'changeCoordinates' },
    {
      action: 'moveFrame',
      messages: { ui: 'renderFrames' },
      nextLabel: 'draggingFrame'
    }
  ],
  [
    { stateLabel: 'draggingFrame', input: 'releaseFrame' },
    { action: 'clear', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'resizingFrame', input: 'changeCoordinates' },
    {
      action: 'sizeFrame',
      messages: { ui: 'renderFrames' },
      nextLabel: 'resizingFrame'
    }
  ],
  [
    { stateLabel: 'resizingFrame', input: 'releaseFrame' },
    { action: 'clear', nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'animating', input: 'startAnimation' },
    { action: 'skip', messages: { ui: 'animateShapes' }, nextLabel: 'animating' }
  ],
  [
    { stateLabel: 'animating', input: 'toIdle' },
    { action: 'skip', messages: { ui: 'renderFrames' }, nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'animating', input: 'createProject' },
    {
      action: 'createProject',
      messages: { db: 'saveNewProject', ui: 'renderFrames' },
      nextLabel: 'idle' }
  ],
  [
    { stateLabel: 'animating', input: 'createShape' },
    { action: 'createShape', messages: { ui: 'renderFrames' }, nextLabel: 'idle' }
  ]
];

// notice that we "get" an object from the map by passing in an array as the "key".
// the above format with an object literal as the "key" is meant for readability.
transitionMap.get = function(key) {
  const match = (pair) => {
    return pair[0].stateLabel === key[0] &&
      pair[0].input === key[1];
  };

  const pair = transitionMap.find(match);

  if (pair) {
    console.log('action: ' + pair[1].action + ',', 'messages:' + pair[1].messages );
    return pair[1]; // returns an object
  } else {
    console.log('core: no transition');
  }
};

export { transitionMap };
