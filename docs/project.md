## **Project: Vibe Machine (working title)**

### **Purpose**

A browser-based prototype for conversational, AI-assisted music creation.
Users type natural language prompts to generate or modify MIDI-like patterns.
Patterns play via Tone.js and are visualised on a Canvas grid.

---

## **System Overview**

| Layer                      | Description                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| **Frontend (React)**       | Chat interface, transport controls, and pattern grid visualiser.                                   |
| **Audio Engine (Tone.js)** | Real-time playback of patterns; manages tempo, scheduling, and instruments.                        |
| **Pattern Logic**          | JSON or DSL representation of tracks, steps, and hits; editable via text or chat commands.         |

---

## **Core Features**

1. **Chat Interaction**

   * Input box for user commands.
   * Simple command parser (“add snare”, “double tempo”, “randomise hats”).
   * Display of interpreted command and feedback (“Added snare on beats 2 and 4”).

2. **Pattern Engine**

   * Internal state:

     ```ts
     type Pattern = {
       bpm: number;
       bars: number;
       tracks: Record<string, number[]>; // e.g. { kick: [0, 1, 2.5] }
     }
     ```
   * Supports basic CRUD actions on tracks:

     * `addTrack(name)`
     * `removeTrack(name)`
     * `addHit(track, position)`
     * `removeHit(track, position)`
     * `setBPM(value)`

3. **Playback (Tone.js)**

   * One **Tone.Part** per track.
   * Instruments:

     * Kick → `Tone.MembraneSynth`
     * Snare → `Tone.NoiseSynth`
     * Hat → `Tone.MetalSynth`
     * Bass → `Tone.Synth`
   * Use `Tone.Transport` for global tempo, looping, and start/stop control.

4. **Visual Grid (Canvas)**

   * 16 steps per bar; 2 bars visible by default.
   * X-axis = time; Y-axis = track.
   * Filled rectangles represent active hits.
   * Highlights current playback position (scrolling playhead).
   * Click to toggle steps (optional mouse editing).

5. **Transport Controls**

   * Play / Stop toggle
   * Tempo slider (60–200 BPM)
   * Loop length selector (1–4 bars)
   * “Export MIDI” button

6. **Persistence**

   * LocalStorage for saving and loading patterns.
   * Option to export pattern JSON or `.mid` (via backend or in-browser library).

---

## **File Structure**

```
/src
  /components
    ChatBox.tsx
    CanvasGrid.tsx
    TransportControls.tsx
  /hooks
    useToneEngine.ts
    usePatternState.ts
  /lib
    patternParser.ts    // DSL → JSON
    midiExporter.ts     // JSON → .mid
  App.tsx
  index.tsx
```

---

## **Tone.js Engine Flow**

1. Convert pattern JSON → Tone.Part sequences:

   ```js
   Object.entries(pattern.tracks).forEach(([name, hits]) => {
     const synth = instruments[name];
     const part = new Tone.Part((time, step) => {
       synth.triggerAttackRelease("C2", "8n", time);
     }, hits.map(t => [t, t]));
     part.start(0);
   });
   ```
2. Attach all parts to `Tone.Transport` at `pattern.bpm`.
3. Control playback via `Transport.start()` / `Transport.stop()`.

---

## **Canvas Rendering Flow**

1. Calculate grid size: `steps * barCount` by `trackCount`.
2. Each frame:

   * Clear canvas.
   * Draw grid lines.
   * Draw filled squares for note hits.
   * Draw a vertical playhead based on `Transport.seconds`.

---

## **Technical Stack**

* **React 18 + Vite** (fast local dev)
* **Tone.js** (synthesis & timing)
* **TypeScript**
* **Canvas API**
* **LocalStorage / IndexedDB** (pattern persistence)

---

## **Future Extensions**

* Natural language → pattern transformation
* Humanisation (random velocity and timing)
* Pattern sharing via short URLs
* Visual themes (colour by energy or mood)
* Multiplayer “collab” mode (socket sync)
