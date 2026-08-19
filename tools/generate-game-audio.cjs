const fs = require('fs');

const output = process.argv[2];
if (!output) throw new Error('Usage: node generate-game-audio.cjs <output.wav>');

const sampleRate = 44100;
const duration = 32;
const length = sampleRate * duration;
const left = new Float32Array(length);
const right = new Float32Array(length);
const tau = Math.PI * 2;

const midi = note => 440 * Math.pow(2, (note - 69) / 12);
const clamp = value => Math.max(-1, Math.min(1, value));

function mix(index, sample, pan = 0) {
  if (index < 0 || index >= length) return;
  const angle = (pan + 1) * Math.PI / 4;
  left[index] += sample * Math.cos(angle);
  right[index] += sample * Math.sin(angle);
}

function envelope(time, noteDuration, attack, release) {
  return Math.min(1, time / attack) * Math.min(1, (noteDuration - time) / release);
}

function addTone(start, noteDuration, frequency, amplitude, voice = 'pluck', pan = 0) {
  const begin = Math.floor(start * sampleRate);
  const samples = Math.floor(noteDuration * sampleRate);
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate;
    let wave;
    if (voice === 'pad') {
      wave = Math.sin(tau * frequency * time) * .72 + Math.sin(tau * frequency * 2 * time) * .18 + Math.sin(tau * frequency * .5 * time) * .1;
    } else if (voice === 'bass') {
      wave = Math.sin(tau * frequency * time) * .82 + Math.sin(tau * frequency * 2 * time) * .18;
    } else {
      wave = Math.sin(tau * frequency * time) * .68 + Math.sin(tau * frequency * 2 * time) * .22 + Math.sin(tau * frequency * 3 * time) * .1;
    }
    const attack = voice === 'pad' ? .16 : .008;
    const release = voice === 'pad' ? .3 : .12;
    const decay = voice === 'pluck' ? Math.exp(-time * 3.8) : 1;
    mix(begin + i, wave * envelope(time, noteDuration, attack, release) * decay * amplitude, pan);
  }
}

function addKick(start, amplitude = .5) {
  const begin = Math.floor(start * sampleRate);
  const noteDuration = .22;
  for (let i = 0; i < noteDuration * sampleRate; i++) {
    const time = i / sampleRate;
    const phase = tau * (132 * time - 170 * time * time);
    const sample = Math.sin(phase) * Math.exp(-time * 18) * amplitude;
    mix(begin + i, sample, 0);
  }
}

function addNoise(start, noteDuration, amplitude, pan, seed, highPass = false) {
  const begin = Math.floor(start * sampleRate);
  let state = seed >>> 0;
  let previous = 0;
  for (let i = 0; i < noteDuration * sampleRate; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const noise = state / 2147483648 - 1;
    const filtered = highPass ? noise - previous * .92 : noise;
    previous = noise;
    const time = i / sampleRate;
    const sample = filtered * Math.exp(-time * (highPass ? 42 : 16)) * amplitude;
    mix(begin + i, sample, pan);
  }
}

const progression = [
  { chord: [60, 64, 67], bass: 36 },
  { chord: [55, 59, 62], bass: 43 },
  { chord: [57, 60, 64], bass: 45 },
  { chord: [53, 57, 60], bass: 41 }
];

for (let bar = 0; bar < 16; bar++) {
  const start = bar * 2;
  const harmony = progression[bar % progression.length];
  harmony.chord.forEach((note, index) => {
    addTone(start, 1.98, midi(note), .075, 'pad', (index - 1) * .42);
    addTone(start, 1.98, midi(note + 12), .018, 'pad', (1 - index) * .55);
  });
  for (let beat = 0; beat < 4; beat++) {
    const time = start + beat * .5;
    addTone(time, .42, midi(harmony.bass), .16, 'bass', beat % 2 ? .08 : -.08);
    addKick(time, beat === 0 ? .58 : .44);
    if (beat === 1 || beat === 3) addNoise(time, .18, .15, beat === 1 ? -.18 : .18, bar * 17 + beat + 4);
    addNoise(time, .055, .055, beat % 2 ? .55 : -.55, bar * 31 + beat + 90, true);
    addNoise(time + .25, .04, .038, beat % 2 ? -.48 : .48, bar * 43 + beat + 180, true);
  }
}

const melody = [72, 76, 79, 81, 79, 76, 74, 72, 74, 79, 83, 81, 79, 76, 74, null];
for (let step = 0; step < duration * 4; step++) {
  const note = melody[step % melody.length];
  if (note !== null) {
    const variation = Math.floor(step / melody.length) % 4 === 3 && step % 8 >= 4 ? 12 : 0;
    addTone(step * .25, .22, midi(note + variation), .12, 'pluck', step % 2 ? .32 : -.32);
  }
}

for (let beat = 0; beat < duration * 2; beat += 4) {
  const time = beat * .5;
  addTone(time + 1.5, .42, midi(84), .055, 'pluck', -.62);
  addTone(time + 1.75, .32, midi(88), .05, 'pluck', .62);
}

let peak = 0;
for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const gain = .88 / Math.max(.001, peak);
const dataSize = length * 4;
const wav = Buffer.alloc(44 + dataSize);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(dataSize, 40);
for (let i = 0; i < length; i++) {
  wav.writeInt16LE(Math.round(clamp(left[i] * gain) * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(clamp(right[i] * gain) * 32767), 46 + i * 4);
}
fs.writeFileSync(output, wav);
console.log(`Generated ${duration}s stereo loop at ${output}`);
