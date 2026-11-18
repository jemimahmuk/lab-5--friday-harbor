// Friday Harbor: soundscape and visualscape
(() => {
  // ---------- Elements ----------
  const sceneBox = document.getElementById('scene-box');
  const svg = document.getElementById('scene');
  const soundscape = document.getElementById('soundscape');
  const gullSound = document.getElementById('gull-sound');
  const bellSound = document.getElementById('bell-sound');
  const orcaSound = document.getElementById('orca-sound');
  const playBtn = document.getElementById('play-btn');
  const timeEl = document.getElementById('time');
  const seek = document.getElementById('seek');
  const volume = document.getElementById('volume');
  const caption = document.getElementById('caption');
  const chaptersEl = document.getElementById('chapters');
  const sky = document.getElementById('sky');
  const sun = document.getElementById('sun');
  const ferry = document.getElementById('ferry');
  const hornText = document.getElementById('horn-text');
  const farLayer = document.getElementById('layer-far');
  const townLayer = document.getElementById('layer-town');
  const cloudsLayer = document.getElementById('layer-clouds');
  const gull = document.getElementById('gull');
  const boats = [document.getElementById('boat1'), document.getElementById('boat2')];
  const buoy = document.getElementById('buoy');
  const orca = document.getElementById('orca');

  // ---------- Settings, open for change ----------
  const FALLBACK_DURATION = 80;              // seconds, used until the audio loads
  const FERRY_FROM = -240;                   // ferry start x (SVG units, off-screen left)
  const FERRY_TO = 800;                      // ferry end x (off-screen right)
  const HORN_TIMES = [30];                   // seconds when the ferry sounds its horn
  const HORN_LENGTH = 2;                     // how long "HOOONK!" stays visible
  const SAIL_COLORS = ['#ff8fab', '#ffe066', '#9bf6ff', '#cdb4db', '#ffafcc', '#b9fbc0'];
  const SKY_STOPS = [                        // morning to sunset
    [0, '#bfe6ff'],
    [0.55, '#dff3ff'],
    [0.85, '#ffd8a8'],
    [1, '#f2a7a0'],
  ];
  // The times for sound
  const CHAPTERS = [
    { time: 0,  label: 'Morning',   text: 'Waves roll under a clear morning sky.' },
    { time: 15, label: 'Gull',      text: 'A gull calls from the dock piling.' },
    { time: 30, label: 'Ferry',     text: 'The ferry crosses toward the harbor and sounds its horn.' },
    { time: 50, label: 'Sailboats', text: 'Wind fills the sails in the harbor.' },
    { time: 64, label: 'Bell buoy', text: 'The bell buoy rings across the water.' },
    { time: 73, label: 'Orca',      text: 'An orca surfaces off the harbor.' },
  ];

  // ---------- State ----------
  let duration = FALLBACK_DURATION;
  let started = false;
  let hasError = false;
  let orcaTimer = null;
  let gullTimer = null;
  let buoyTimer = null;
  const chapterButtons = [];

  // ---------- Helpers ----------
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  const fmt = (sec) => {
    const s = Math.floor(sec || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  const mix = (a, b, t) => {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    return '#' + A
      .map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'))
      .join('');
  };

  const skyColor = (p) => {
    for (let i = 1; i < SKY_STOPS.length; i++) {
      const [p1, c1] = SKY_STOPS[i];
      if (p <= p1) {
        const [p0, c0] = SKY_STOPS[i - 1];
        return mix(c0, c1, (p - p0) / (p1 - p0));
      }
    }
    return SKY_STOPS[SKY_STOPS.length - 1][1];
  };

  const showError = () => {
    hasError = true;
    caption.textContent =
      'The soundscape did not load. Check that assets/soundscape.mp3 sits in the assets folder next to index.html.';
  };

  const play = () => {
    hasError = false;
    const p = soundscape.play();
    if (p && typeof p.catch === 'function') p.catch(showError);
  };

  const togglePlay = () => {
    if (soundscape.paused) play();
    else soundscape.pause();
  };

  const playEffect = (audio) => {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  // ---------- Chapter buttons ----------
  CHAPTERS.forEach((ch) => {
    const btn = document.createElement('button');
    btn.textContent = `${fmt(ch.time)} ${ch.label}`;
    btn.addEventListener('click', () => {
      soundscape.currentTime = ch.time;
      if (soundscape.paused) play();
    });
    chaptersEl.appendChild(btn);
    chapterButtons.push(btn);
  });

  // ---------- Audio events ----------
  soundscape.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(soundscape.duration)) {
      duration = soundscape.duration;
      seek.max = duration;
    }
  });

  soundscape.addEventListener('error', showError);

  soundscape.addEventListener('play', () => {
    started = true;
    sceneBox.classList.add('playing');
    playBtn.innerHTML = '&#10074;&#10074; Pause';
  });

  soundscape.addEventListener('pause', () => {
    sceneBox.classList.remove('playing');
    playBtn.innerHTML = '&#9654; Play';
  });

  soundscape.addEventListener('ended', () => {
    soundscape.pause();
    soundscape.currentTime = 0;
  });

  // ---------- Controls ----------
  playBtn.addEventListener('click', togglePlay);

  seek.addEventListener('input', () => {
    soundscape.currentTime = Number(seek.value);
  });

  const applyVolume = () => {
    const v = Number(volume.value);
    soundscape.volume = v;
    gullSound.volume = v;
    bellSound.volume = v;
    orcaSound.volume = v;
  };
  volume.addEventListener('input', applyVolume);
  applyVolume();

  // Space bar plays or pauses, unless a button or input has focus
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (['BUTTON', 'INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    e.preventDefault();
    togglePlay();
  });

  // ---------- Clickable scene pieces ----------
  gull.addEventListener('click', () => {
    playEffect(gullSound);
    gull.classList.add('flap');
    clearTimeout(gullTimer);
    gullTimer = setTimeout(() => gull.classList.remove('flap'), 1000);
  });

  boats.forEach((boat) => {
    boat.addEventListener('click', () => {
      const sail = boat.querySelector('.sail');
      const current = sail.getAttribute('fill');
      const options = SAIL_COLORS.filter((c) => c !== current);
      sail.setAttribute('fill', options[Math.floor(Math.random() * options.length)]);
    });
  });

  buoy.addEventListener('click', () => {
    playEffect(bellSound);
    buoy.classList.remove('ring');
    void buoy.getBoundingClientRect(); // restart the swing animation
    buoy.classList.add('ring');
    clearTimeout(buoyTimer);
    buoyTimer = setTimeout(() => buoy.classList.remove('ring'), 1500);
  });

  orca.addEventListener('click', () => {
    playEffect(orcaSound);
    orca.classList.add('surface');
    clearTimeout(orcaTimer);
    orcaTimer = setTimeout(() => orca.classList.remove('surface'), 2500);
  });

  // ---------- Visualscape: sync the scene to the audio time ----------
  const render = (t) => {
    const p = clamp(t / duration, 0, 1);

    // Sky color and sun arc across the day
    sky.setAttribute('fill', skyColor(p));
    sun.setAttribute('cx', (80 + p * 640).toFixed(1));
    sun.setAttribute('cy', (190 - 130 * Math.sin(p * Math.PI)).toFixed(1));

    // Ferry crosses the harbor
    const fx = FERRY_FROM + p * (FERRY_TO - FERRY_FROM);
    ferry.setAttribute('transform', `translate(${fx.toFixed(1)} 0)`);

    // HOOONK shows during the horn times
    const hornOn = HORN_TIMES.some((h) => t >= h && t < h + HORN_LENGTH);
    hornText.classList.toggle('show', hornOn);

    // Current chapter drives the caption and the highlighted button
    let idx = 0;
    CHAPTERS.forEach((ch, i) => {
      if (t >= ch.time) idx = i;
    });
    chapterButtons.forEach((b, i) => b.classList.toggle('current', i === idx));
    if (!hasError) {
      caption.textContent = !started && t === 0 ? 'Press play to begin.' : CHAPTERS[idx].text;
    }

    // Time readout and seek bar
    timeEl.textContent = `${fmt(t)} / ${fmt(duration)}`;
    if (document.activeElement !== seek) seek.value = t;
  };

  // Mouse moves the layers slightly for a sense of depth
  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;

  svg.addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
    ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
  });

  svg.addEventListener('mouseleave', () => {
    tx = 0;
    ty = 0;
  });

  const frame = () => {
    mx += (tx - mx) * 0.08;
    my += (ty - my) * 0.08;
    farLayer.style.transform = `translate(${(-6 * mx).toFixed(2)}px, ${(-2 * my).toFixed(2)}px)`;
    townLayer.style.transform = `translate(${(-12 * mx).toFixed(2)}px, ${(-3 * my).toFixed(2)}px)`;
    cloudsLayer.style.transform = `translate(${(-18 * mx).toFixed(2)}px, 0px)`;
    render(soundscape.currentTime || 0);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
})();
