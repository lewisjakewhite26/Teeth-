# Teeth

Cinematic slideshow for the Year 3/4 science lesson on teeth (animals including humans). Dark screen, one photo at a time, fading from one to the next. The last slide is a 3D human skull.

## Teaching with it

Open `teeth-lesson.html` in a browser. It works offline as a single file.

- Click, Space, Right arrow or Page Down: next slide
- Left arrow, Page Up or right-click: back
- F or double-click: fullscreen
- M: mute the transition sound

## The human teeth glow

On the human photo, each click lights one type of tooth before moving on: incisors (blue, cut and bite), canines (gold, grip and tear), premolars (green, crush), then molars (purple, grind). Left arrow steps back through them. The tooth positions are in `src/teeth-map.js`.

## The 3D skull

The last slide is a 3D human skull.

- Tap a tooth: it flies in and the tooth sits in the middle of the screen. Tap another tooth to move to that one.
- Tap the black background (not the far edges): back to the whole skull.
- One finger drag: turn it.
- Two fingers: pinch to zoom, slide to move it. With a mouse, right-drag or shift-drag moves it and the wheel zooms.
- Left alone, it drifts slowly left and right.
- Tap the far left or far right edge of the screen, or use the arrow keys, to go back or forward.

The model is `src/model/skull.glb`. It was trimmed from a male and female skull set to the male skull only, with smaller textures.

## Changing the slides

The photos are in `src/img`. The number at the start of each file name sets the order. To add, remove or reorder slides, change the files, then rebuild:

    npm install
    npm run build

The new single file is `dist/index.html`.
