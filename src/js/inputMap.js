const inputMap = [
  // event type   target type           input
  [['click',     'newShapeButton'   ], 'createShape'       ],
  [['click',     'newProjectButton' ], 'createProject'     ],
  [['click',     'animateButton'    ], 'startAnimation'    ],
  [['click',     'deleteLink'       ], 'deleteFrame'       ],
  [['click',     'canvas'           ], 'toIdle'            ],
  [['click',     'canvas'           ], 'toIdle'            ],
  [['mousedown', 'frame'            ], 'modifyPosition'    ],
  [['mousedown', 'top-left-corner'  ], 'resizeFrame'       ],
  [['mousedown', 'top-right-corner' ], 'resizeFrame'       ],
  [['mousedown', 'bot-left-corner'  ], 'resizeFrame'       ],
  [['mousedown', 'bot-right-corner' ], 'resizeFrame'       ],
  [['mousedown', 'canvas'           ], 'createFrame'       ],
  [['mousemove'                     ], 'changeCoordinates' ],
  [['mouseup'                       ], 'releaseFrame'      ],
];

inputMap.get = function(key) {
  const match = (pair) => {
    return pair[0][0] === key[0] &&
      pair[0][1] === key[1];
  };

  const pair = inputMap.find(match);

  if (pair) {
    return pair[1];
  } else {
    console.log('ui: no proper input');
  }
};

export { inputMap };
