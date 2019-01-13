// eventType: type of event that occured (e.g., 'click')
// nodeType:  type of node on which the event occured, if any (e.g., 'frame')
// action:    name of state-changing action that should be invoked (e.g.,'skip')
// messages:  messages to be sent to machine subscribers
// nextLabel: state label that the machine will transition to (e.g., 'idle')

const blueprint = {
  start: [
    {
      eventType: 'kickoff',
      action: 'skip',
      messages: {
        db: 'loadProjectIds',
      },
      nextLabel: 'idle',
    }
  ],

  idle: [
    {
      eventType: 'click',
      nodeType: 'newShapeButton',
      action: 'createShape',
      nextLabel: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'newProjectButton',
      action: 'createProject',
      messages: {
        db: 'saveNewProject',
        ui: 'renderFrames',
      },
      nextLabel: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'animateButton',
      action: 'skip',
      messages: {
        ui: 'animateShapes',
      },
      nextLabel: 'animating',
    },
    {
      eventType: 'projectSaved',
      action: 'skip',
      messages: {
        ui: 'displaySavedNewFlash',
      },
      nextLabel: 'idle',
    },
    {
      eventType: 'projectIdsLoaded',
      action: 'processProjectIds',
      messages: {
        ui: 'renderProjectIds',
      },
      nextLabel: 'idle',
    },
    {
      eventType: 'mousedown',
      nodeType: 'frame',
      action: 'grabFrame',
      messages: {
        ui: 'renderFrames',
      },
      nextLabel: 'draggingFrame',
    },
    {
      eventType: 'mousedown',
      nodeType: 'corner',
      action: 'grabCorner',
      nextLabel: 'resizingFrame',
    },
    {
      eventType: 'mousedown',
      nodeType: 'canvas',
      action: 'setFrameOrigin',
      nextLabel: 'drawingFrame',
    },
    {
      eventType: 'click',
      nodeType: 'deleteLink',
      action: 'deleteFrame',
      messages: {
        ui: 'renderFrames',
      },
      nextLabel: 'idle',
    }
  ],

  drawingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      messages: {
        ui: 'renderFrames',
      },
      nextLabel: 'drawingFrame',
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextLabel: 'idle',
    }
  ],

  draggingFrame: [
    {
      eventType: 'mousemove',
      action: 'moveFrame',
      messages: {
        ui: 'renderFrames',
      },
      nextLabel: 'draggingFrame',
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextLabel: 'idle',
    }
  ],

  resizingFrame: [
    {
      eventType: 'mousemove',
      action: 'sizeFrame',
      messages: {
        ui: 'renderFrames',
      },
      nextLabel: 'resizingFrame',
    },
    {
      eventType: 'mouseup',
      action: 'clear',
      nextLabel: 'idle',
    }
  ],

  animating: [
    {
      eventType: 'click',
      nodeType: 'canvas',
      action: 'skip',
      messages: {
        ui: 'renderFrames',
      },
      nextLabel: 'idle',
    },
    {
      eventType: 'click',
      nodeType: 'animateButton',
      action: 'skip',
      messages: {
        ui: 'animateShapes',
      },
      nextLabel: 'animating',
    },
  ]
};

export { blueprint };
