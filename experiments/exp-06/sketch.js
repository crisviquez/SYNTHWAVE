// ---------- Audio ----------
const audioEl = document.getElementById('audio');
const fileInput = document.getElementById('file');
const playBtn = document.getElementById('play');

let audioCtx, analyser;
let freqData = new Uint8Array(512); // vacío al inicio; se reemplaza en initAudio()

// ---------- Estado visual ----------
const bands = { bass: 0, mid: 0, treble: 0 }; // 0..1, suavizadas
let prevBass = 0;
let sensitivity = 1;
let baseHue = 280;
let particles = [];
const BARS = 90;

// ---------- UI ----------
document.getElementById('sens').addEventListener('input', e => sensitivity = parseFloat(e.target.value));
document.getElementById('hue').addEventListener('input', e => baseHue = parseFloat(e.target.value));

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (audioEl.src) URL.revokeObjectURL(audioEl.src);
  audioEl.src = URL.createObjectURL(file);
  playBtn.disabled = false;
});

playBtn.addEventListener('click', async () => {
  initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (audioEl.paused) audioEl.play(); else audioEl.pause();
});

audioEl.addEventListener('play', () => playBtn.textContent = 'Pause');
audioEl.addEventListener('pause', () => playBtn.textContent = 'Play');

function initAudio() {
  if (audioCtx) return; // createMediaElementSource solo puede llamarse una vez por <audio>
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;               // 1024 muestras -> 512 bins
  analyser.smoothingTimeConstant = 0.8;  // suavizado temporal interno
  const source = audioCtx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(audioCtx.destination); // sin esto no se oye nada
  freqData = new Uint8Array(analyser.frequencyBinCount);
}

// Energía media (0..1) entre dos frecuencias en Hz
function bandEnergy(fromHz, toHz) {
  const hzPerBin = audioCtx.sampleRate / analyser.fftSize;
  const a = Math.floor(fromHz / hzPerBin);
  const b = Math.min(Math.ceil(toHz / hzPerBin), freqData.length - 1);
  let sum = 0;
  for (let i = a; i <= b; i++) sum += freqData[i];
  return sum / (b - a + 1) / 255;
}

function updateAudio() {
  if (!analyser) return;
  analyser.getByteFrequencyData(freqData); // rellena freqData con valores 0..255
  const raw = {
    bass: bandEnergy(20, 150),
    mid: bandEnergy(150, 2000),
    treble: bandEnergy(2000, 10000),
  };
  for (const k in bands) {
    bands[k] = lerp(bands[k], constrain(raw[k] * sensitivity, 0, 1), 0.3);
  }
}

// ---------- p5 ----------
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
}

function draw() {
  updateAudio();
  background(0, 0, 6, 0.25); // alpha < 1 => estela
  translate(width / 2, height / 2);

  const R = min(width, height) * 0.18;
  const r = R * (1 + bands.bass * 0.35); // el radio "late" con los graves

  drawBars(r);
  drawCore(r);
  updateParticles(r);

  if (!audioEl.src) {
    noStroke();
    fill(0, 0, 100, 0.6);
    textAlign(CENTER);
    textSize(14);
    text('Elige un archivo de audio', 0, R * 3.2);
  }
}

function drawBars(r) {
  const maxLen = min(width, height) * 0.22;
  strokeWeight(max(2, width / 450));
  strokeCap(ROUND);
  for (let k = 0; k < BARS; k++) {
    const t = k / BARS;
    const bin = floor(pow(t, 2) * freqData.length * 0.6); // escala cuadrática: más resolución en graves
    const v = constrain(freqData[bin] / 255 * sensitivity, 0, 1);
    const len = 4 + v * maxLen;
    stroke((baseHue + t * 80) % 360, 80, 100, 0.5 + v * 0.5);
    // mitad derecha e izquierda (espejo) => simetría
    for (const a of [-HALF_PI + t * PI, -HALF_PI - t * PI]) {
      line(cos(a) * r, sin(a) * r, cos(a) * (r + len), sin(a) * (r + len));
    }
  }
}

function drawCore(r) {
  drawingContext.shadowBlur = 30 + bands.bass * 40; // brillo (API nativa de canvas 2D)
  drawingContext.shadowColor = `hsl(${baseHue}, 100%, 60%)`;
  stroke(baseHue, 60, 100);
  strokeWeight(3);
  fill(baseHue, 40, 8);
  circle(0, 0, r * 1.8);
  drawingContext.shadowBlur = 0; // reset, o todo lo siguiente brillaría

  noFill();
  stroke((baseHue + 40) % 360, 60, 100, 0.4);
  strokeWeight(2);
  circle(0, 0, r * (0.4 + bands.mid * 1.0));
}

class Particle {
  constructor(r) {
    const dir = p5.Vector.fromAngle(random(TWO_PI));
    this.pos = dir.copy().mult(r);
    this.vel = dir.mult(random(1, 3) + bands.bass * 6);
    this.life = 1;
    this.size = random(1.5, 4);
    this.hue = (baseHue + random(-30, 60) + 360) % 360;
  }
  update() {
    this.pos.add(this.vel);
    this.life -= 0.012;
  }
  draw() {
    noStroke();
    fill(this.hue, 70, 100, this.life);
    circle(this.pos.x, this.pos.y, this.size);
  }
}

function updateParticles(r) {
  const kick = bands.bass - prevBass > 0.04; // subida brusca de graves
  prevBass = bands.bass;
  const n = floor(bands.treble * 4) + (kick ? 12 : 0);
  for (let i = 0; i < n && particles.length < 600; i++) particles.push(new Particle(r));

  for (let i = particles.length - 1; i >= 0; i--) { // al revés para poder hacer splice
    const p = particles[i];
    p.update();
    p.draw();
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}