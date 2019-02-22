const inputTable = [
  // event type     pointer target        input
  // NEW

  [['mousedown',   'wrapper'          ], 'select'          ],
  
  // notice that the next two inputs are only possible
  // if the shape is selected, because otherwise
  // neither dots nor corners will be visible:
  [['mousedown',   'dot'              ], 'initRotate'      ],
  [['mousedown',   'corner'           ], 'initScale'       ],

  // I think this could be more specifically geared towards
  // highlighted wrappers:
  [['dblclick',    'wrapper'          ], 'selectThrough'   ],
  [['mousemove'                       ], 'movePointer'     ],
  [['mouseup'                         ], 'release'         ],


  // OLD (some still relevant, some not)

  // [['click',       'newShapeButton'   ], 'createShape'     ],
  // [['click',       'newDocButton'     ], 'createDoc'       ],
  // [['click',       'animateButton'    ], 'animate'         ],
  // [['click',       'doc-list-entry'   ], 'requestDoc'      ],
  // [['click',       'deleteLink'       ], 'deleteFrame'     ],
  // [['click',       'canvas'           ], 'edit'            ],
  // [['mousedown',   'frame'            ], 'getFrameOrigin'  ],
  // [['mousedown',   'top-left-corner'  ], 'findOppCorner'   ],
  // [['mousedown',   'top-right-corner' ], 'findOppCorner'   ],
  // [['mousedown',   'bot-left-corner'  ], 'findOppCorner'   ],
  // [['mousedown',   'bot-right-corner' ], 'findOppCorner'   ],
  // [['mousedown',   'canvas'           ], 'setFrameOrigin'  ],
  // [['mousedown',   'rotate-handle'    ], 'getStartAngle'   ],
  // [['mousemove'                       ], 'changeCoords'    ],
  // [['mouseup'                         ], 'releaseFrame'    ],
];

inputTable.get = function(key) {
  const match = (pair) => {
    return pair[0][0] === key[0] &&
      (pair[0][1] === key[1] || pair[0][1] === undefined);
  };

  const pair = inputTable.find(match);

  if (pair) {
    return pair[1];
  }
};

export { inputTable };
