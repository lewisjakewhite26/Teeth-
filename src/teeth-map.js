// Where each tooth sits on the human photo (09-human.jpg, 1577 x 1958).
// [centre x, centre y, half width, half height, tilt in degrees]
export const PHOTO = { w: 1577, h: 1958 };

export const STAGES = [
  {
    key: 'incisors', name: 'Incisors', job: 'cut and bite', colour: '#3da5f4',
    teeth: [
      [720, 675, 68, 78, 0], [865, 675, 68, 78, 0], [602, 688, 46, 62, 4], [985, 690, 44, 62, -4],
      [670, 1582, 42, 52, 4], [755, 1592, 42, 54, 0], [840, 1592, 42, 54, 0], [922, 1582, 42, 52, -4],
    ],
  },
  {
    key: 'canines', name: 'Canines', job: 'grip and tear', colour: '#ffc531',
    teeth: [
      [512, 712, 40, 70, 10], [1068, 712, 40, 68, -10],
      [590, 1545, 40, 58, 18], [1005, 1540, 40, 58, -18],
    ],
  },
  {
    key: 'premolars', name: 'Premolars', job: 'crush', colour: '#46c28a',
    teeth: [
      [455, 752, 34, 58, 14], [420, 805, 28, 40, 18], [1125, 765, 34, 58, -14], [1163, 810, 28, 40, -18],
      [535, 1490, 48, 40, 30], [485, 1430, 50, 42, 35], [1065, 1485, 48, 40, -30], [1115, 1425, 50, 42, -35],
    ],
  },
  {
    key: 'molars', name: 'Molars', job: 'grind', colour: '#9b7bea',
    teeth: [
      [460, 850, 66, 40, 20], [1160, 850, 62, 40, -20],
      [470, 1350, 62, 48, 35], [430, 1255, 60, 48, 40], [1135, 1345, 62, 48, -35], [1160, 1250, 60, 48, -40],
    ],
  },
];
