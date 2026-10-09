// Where each tooth sits on the human photo (09-human.jpg, 1577 x 1958).
// [centre x, centre y, half width, half height, tilt in degrees]
export const PHOTO = { w: 1577, h: 1958 };

export const STAGES = [
  {
    key: 'incisors', name: 'Incisors', job: 'cut and bite', colour: '#3da5f4',
    does: 'Flat with a sharp edge, like a tiny chisel. They slice off a bite of food, like biting into an apple.', act: 'Scissor fingers: snip, snip',
    teeth: [
      [720, 675, 68, 78, 0], [865, 675, 68, 78, 0], [602, 688, 46, 62, 4], [985, 690, 44, 62, -4],
      [670, 1582, 42, 52, 4], [755, 1592, 42, 54, 0], [840, 1592, 42, 54, 0], [922, 1582, 42, 52, -4],
    ],
  },
  {
    key: 'canines', name: 'Canines', job: 'grip and tear', colour: '#ffc531',
    does: 'Pointed and strong. They hold on to tough food and tear it apart, like meat.', act: 'Fang fingers: grip and pull',
    teeth: [
      [512, 712, 40, 70, 10], [1068, 712, 40, 68, -10],
      [590, 1545, 40, 58, 18], [1005, 1540, 40, 58, -18],
    ],
  },
  {
    key: 'premolars', name: 'Premolars', job: 'crush', colour: '#46c28a',
    does: 'Wide, with two bumps on top. They squash and crush food into smaller pieces.', act: 'Fist into your palm: crush',
    teeth: [
      [455, 752, 34, 58, 14], [420, 805, 28, 40, 18], [1125, 765, 34, 58, -14], [1163, 810, 28, 40, -18],
      [535, 1490, 48, 40, 30], [485, 1430, 50, 42, 35], [1065, 1485, 48, 40, -30], [1115, 1425, 50, 42, -35],
    ],
  },
  {
    key: 'molars', name: 'Molars', job: 'grind', colour: '#9b7bea',
    does: 'The biggest and flattest, right at the back. They grind food into a soft mush before we swallow it.', act: 'Roll your fists: grind',
    teeth: [
      [460, 850, 66, 40, 20], [1160, 850, 62, 40, -20],
      [470, 1350, 62, 48, 35], [430, 1255, 60, 48, 40], [1135, 1345, 62, 48, -35], [1160, 1250, 60, 48, -40],
    ],
  },
];
