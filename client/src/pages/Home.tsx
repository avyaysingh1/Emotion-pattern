import { Camera, CameraOff, Check, ChevronRight, CircleHelp, Headphones, Heart, LoaderCircle, Moon, Music2, Pause, Play, RefreshCw, ShieldCheck, Sparkles, Sun, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getMood, MOODS, type MoodId } from "@/features/mirror/emotion";
import { createAmbientPlayer, type AmbientPlayer } from "@/features/mirror/music";
import { useEmotionMirror } from "@/features/mirror/useEmotionMirror";
import { MIRROR_FILTERS, type MirrorFilterId } from "@/features/mirror/filters";
import { FACE_EMOTES, type FaceEmoteId } from "@/features/mirror/emotes";
import { FaceEmoteOverlay } from "@/features/mirror/FaceEmoteOverlay";
import { FaceWireframeOverlay } from "@/features/mirror/FaceWireframeOverlay";

function statusText(state: string) {
  if (state === "requesting") return "Waiting for permission";
  if (state === "loading") return "Warming up the mirror";
  if (state === "live") return "Mirror is live";
  if (state === "no-face") return "Looking for your face";
  if (state === "error") return "Mirror paused";
  return "Camera is off";
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem("mira-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [faceEmoteId, setFaceEmoteId] = useState<FaceEmoteId>("none");
  const [wireframeEnabled, setWireframeEnabled] = useState(true);
  const mirror = useEmotionMirror(wireframeEnabled || faceEmoteId !== "none");
  const [manualMood, setManualMood] = useState<MoodId | null>(null);
  const [filterId, setFilterId] = useState<MirrorFilterId>("natural");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.55);
  const [musicError, setMusicError] = useState("");
  const playerRef = useRef<AmbientPlayer | null>(null);

  const activeMoodId = manualMood ?? mirror.expression?.mood ?? null;
  const activeMood = activeMoodId ? getMood(activeMoodId) : null;
  const selectedFilter = MIRROR_FILTERS.find((filter) => filter.id === filterId) ?? MIRROR_FILTERS[0];
  const selectedEmote = FACE_EMOTES.find((emote) => emote.id === faceEmoteId) ?? FACE_EMOTES[0];
  const isManualMood = manualMood !== null;
  const isScanning = mirror.cameraState === "live" || mirror.cameraState === "no-face";

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("mira-theme", theme);
    } catch {
      // The appearance switch still works for this visit if storage is unavailable.
    }
  }, [isDarkMode]);

  useEffect(() => {
    setSuggestionIndex(0);
    if (activeMoodId) playerRef.current?.setMood(activeMoodId);
  }, [activeMoodId]);

  useEffect(() => {
    playerRef.current?.setVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => () => playerRef.current?.stop(), []);

  const toggleMusic = () => {
    setMusicError("");
    if (musicPlaying) {
      playerRef.current?.stop();
      playerRef.current = null;
      setMusicPlaying(false);
      return;
    }
    try {
      playerRef.current = createAmbientPlayer(activeMoodId ?? "calm", musicVolume);
      setMusicPlaying(true);
    } catch {
      setMusicError("Audio playback is not available in this browser.");
    }
  };

  const chooseMood = (moodId: MoodId) => {
    setManualMood(moodId);
    setSuggestionIndex(0);
  };

  const nextSuggestion = () => {
    if (!activeMood) return;
    setSuggestionIndex((index) => (index + 1) % activeMood.suggestions.length);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Mira emotion mirror home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-name">mira<span>.</span></span>
          <span className="brand-divider" />
          <span className="brand-caption">EMOTION MIRROR</span>
        </a>
        <div className="topbar-right">
          <button
            className="theme-toggle"
            type="button"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDarkMode}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setIsDarkMode((enabled) => !enabled)}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <span className="privacy-chip"><ShieldCheck size={14} /> ON-DEVICE & PRIVATE</span>
          <button className="text-action" type="button" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
            HOW IT WORKS <ChevronRight size={15} />
          </button>
        </div>
      </header>

      <section className="intro-row" aria-labelledby="page-title">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> A MOMENT TO CHECK IN</p>
          <h1 id="page-title">See how you <em>feel.</em><br />Then meet yourself there.</h1>
        </div>
        <p className="intro-copy">A gentle, camera-based reflection. Notice an expression, choose what feels right, and find one small thing that could help.</p>
      </section>

      <section className="mirror-layout" aria-label="Emotion mirror">
        <div className="mirror-column">
          <div className="section-heading">
            <span className="section-kicker">01 <span className="section-rule" /> THE MIRROR</span>
            <span className={`live-badge ${isScanning ? "is-live" : ""}`}><span /> {statusText(mirror.cameraState)}</span>
          </div>
          <div className={`mirror-frame ${activeMood ? `mood-${activeMood.id}` : ""}`}>
            <div className="mirror-frame-top">
              <span><Sparkles size={14} /> EXPRESSION REFLECTION</span>
              <span className="frame-time">LIVE · PRIVATE SESSION</span>
            </div>
            <div className={`mirror-screen ${mirror.cameraActive ? "has-camera" : ""}`}>
              <video ref={mirror.videoRef} autoPlay muted playsInline aria-label="Live mirrored camera preview" style={{ filter: selectedFilter.css }} />
              <div className="mirror-grain" aria-hidden="true" />
              {mirror.cameraActive && wireframeEnabled && (
                <FaceWireframeOverlay
                  landmarks={mirror.faceMesh}
                  videoWidth={mirror.videoRef.current?.videoWidth ?? 0}
                  videoHeight={mirror.videoRef.current?.videoHeight ?? 0}
                />
              )}
              {mirror.cameraActive && faceEmoteId !== "none" && (
                <FaceEmoteOverlay
                  emoteId={faceEmoteId}
                  anchors={mirror.faceAnchors}
                  videoWidth={mirror.videoRef.current?.videoWidth ?? 0}
                  videoHeight={mirror.videoRef.current?.videoHeight ?? 0}
                />
              )}
              {mirror.cameraActive ? (
                <>
                  <div className="face-corner corner-tl" aria-hidden="true" /><div className="face-corner corner-tr" aria-hidden="true" />
                  <div className="face-corner corner-bl" aria-hidden="true" /><div className="face-corner corner-br" aria-hidden="true" />
                  {activeMood && <div className="video-mood-tag"><span>{activeMood.emoji}</span> {activeMood.label.toUpperCase()}</div>}
                  {mirror.cameraState === "loading" && <div className="mirror-overlay"><LoaderCircle className="spin" size={21} /><span>Preparing your private mirror…</span></div>}
                  {mirror.cameraState === "no-face" && <div className="mirror-overlay"><CircleHelp size={21} /><span>Move into the frame when you’re ready</span></div>}
                </>
              ) : (
                <div className="camera-welcome">
                  <div className="mirror-orbit" aria-hidden="true"><span className="orbit-dot" /><div className="orbit-face">☺</div><span className="orbit-spark orbit-spark-one">✦</span><span className="orbit-spark orbit-spark-two">·</span></div>
                  <p className="camera-kicker">YOUR REFLECTION, YOURS ALONE</p>
                  <h2>{mirror.cameraState === "error" ? "Let's try again." : "Make a little space for you."}</h2>
                  <p className="camera-copy">Your camera stays in this browser. No video is saved or sent to a server.</p>
                  {mirror.errorMessage && <p className="camera-error" role="alert">{mirror.errorMessage}</p>}
                  <button className="primary-button camera-start" type="button" onClick={mirror.startCamera} disabled={mirror.cameraState === "requesting" || mirror.cameraState === "loading"}>
                    {mirror.cameraState === "requesting" ? <LoaderCircle className="spin" size={17} /> : <Camera size={17} />}
                    {mirror.cameraState === "requesting" ? "Waiting for permission…" : "Start live mirror"}
                    {mirror.cameraState !== "requesting" && <ChevronRight size={16} />}
                  </button>
                </div>
              )}
              <div className="screen-bottom-left"><span className="screen-lock"><ShieldCheck size={13} /></span> CAMERA FRAMES STAY ON THIS DEVICE</div>
              {mirror.cameraActive && <div className="screen-bottom-right">{mirror.expression ? `${mirror.expression.confidence}% SIGNAL` : "NO SIGNAL YET"}</div>}
            </div>
            {mirror.cameraActive && (
              <div className="filter-controls" role="group" aria-label="Camera preview filters">
                <div className="filter-controls-top">
                  <span>PREVIEW LOOK</span>
                  <span>{selectedFilter.label.toUpperCase()} · DISPLAY ONLY</span>
                </div>
                <div className="filter-tray" role="group" aria-label="Choose a preview filter">
                  {MIRROR_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      className={`filter-choice ${filterId === filter.id ? "selected" : ""}`}
                      type="button"
                      aria-label={`${filter.label} camera filter`}
                      aria-pressed={filterId === filter.id}
                      onClick={() => setFilterId(filter.id)}
                      title={filter.label}
                      style={{ "--filter-swatch": filter.swatch } as React.CSSProperties}
                    >
                      <span className="filter-swatch" aria-hidden="true" />
                      <small>{filter.label}</small>
                    </button>
                  ))}
                </div>
                <p className="filter-footnote">The mood model still reads the original camera feed.</p>
                <div className="tracking-controls">
                  <div className="tracking-label">
                    <strong>FACE TRACKING</strong>
                    <small>{wireframeEnabled ? (mirror.faceMesh ? "LANDMARK MESH · LIVE" : "LOOKING FOR FACE") : faceEmoteId !== "none" ? "EMOTE TRACKING · LIVE" : "MESH OFF"}</small>
                  </div>
                  <button
                    className={`wireframe-toggle ${wireframeEnabled ? "is-on" : ""}`}
                    type="button"
                    aria-label={wireframeEnabled ? "Turn wireframe face tracking off" : "Turn wireframe face tracking on"}
                    aria-pressed={wireframeEnabled}
                    onClick={() => setWireframeEnabled((enabled) => !enabled)}
                  >
                    <span className="wireframe-check" aria-hidden="true">{wireframeEnabled && <Check size={12} strokeWidth={3} />}</span>
                    <span>Wireframe</span>
                  </button>
                </div>
                <div className="emote-controls">
                  <div className="filter-controls-top">
                    <span>FACE EMOTES</span>
                    <span>{selectedEmote.label.toUpperCase()} · {faceEmoteId === "none" ? "OFF" : mirror.faceAnchors ? "TRACKING" : "WAITING FOR FACE"}</span>
                  </div>
                  <div className="emote-tray" role="group" aria-label="Choose a face emote">
                    {FACE_EMOTES.map((emote) => (
                      <button
                        key={emote.id}
                        className={`emote-choice ${faceEmoteId === emote.id ? "selected" : ""}`}
                        type="button"
                        aria-label={emote.id === "none" ? "Turn off face emotes" : `Apply ${emote.label} face emote`}
                        aria-pressed={faceEmoteId === emote.id}
                        onClick={() => setFaceEmoteId(emote.id)}
                        title={emote.label}
                      >
                        <span aria-hidden="true">{emote.emoji}</span>
                        <small>{emote.label}</small>
                      </button>
                    ))}
                  </div>
                  <p className="filter-footnote">Stickers follow your face locally and are not recorded.</p>
                </div>
              </div>
            )}
            <div className="mirror-foot">
              <div className="mirror-foot-copy"><span className="foot-signal" /> {mirror.cameraActive ? "A reflection, not a verdict." : "A softer way to check in."}</div>
              {mirror.cameraActive && <button className="camera-stop" type="button" onClick={mirror.stopCamera}><CameraOff size={15} /> Turn camera off</button>}
              {mirror.cameraState === "error" && <button className="camera-stop" type="button" onClick={mirror.startCamera}><RefreshCw size={14} /> Try again</button>}
            </div>
          </div>
          <p className="mirror-caption"><span>NOTE</span> Facial expressions are only clues. You’re the expert on how you feel.</p>
        </div>

        <aside className="insight-column" aria-label="Mood reflection and suggestions">
          <div className="section-heading">
            <span className="section-kicker">02 <span className="section-rule" /> YOUR CHECK-IN</span>
            <span className="gentle-note"><Heart size={13} /> NO RIGHT ANSWER</span>
          </div>

          <div className="mood-card" style={{ "--mood-color": activeMood?.color ?? "#d9f179" } as React.CSSProperties} aria-live="polite">
            <div className="mood-card-top"><span>{isManualMood ? "YOUR PICK" : mirror.expression ? "LIVE EXPRESSION CUE" : "A MOOD TO START WITH?"}</span><span className="mood-index">M / 02</span></div>
            {activeMood ? (
              <div className="mood-readout">
                <div className="mood-emoji-wrap"><span className="mood-emoji" key={activeMood.id}>{activeMood.emoji}</span><span className="emoji-aura" /></div>
                <div className="mood-text"><h2>{activeMood.label}<span>.</span></h2><p>{activeMood.descriptor}</p></div>
              </div>
            ) : (
              <div className="mood-empty"><span className="mood-empty-icon">✳</span><p>Start the mirror, or tap an emoji below to choose what feels closest.</p></div>
            )}
            {mirror.expression && !isManualMood && <div className="confidence-row"><span>EXPRESSION MATCH</span><div className="confidence-track"><i style={{ width: `${mirror.expression.confidence}%` }} /></div><strong>{mirror.expression.confidence}%</strong></div>}
            {isManualMood && mirror.expression && <button className="return-to-live" type="button" onClick={() => setManualMood(null)}><RefreshCw size={13} /> Return to the mirror’s cue</button>}
          </div>

          <section className="suggestion-card" aria-labelledby="suggestion-title">
            <div className="suggestion-heading"><span className="section-kicker small"><Sparkles size={14} /> A GENTLE NEXT STEP</span><span className="suggestion-count">{activeMood ? `0${suggestionIndex + 1} / 0${activeMood.suggestions.length}` : "—"}</span></div>
            <h3 id="suggestion-title">{activeMood ? activeMood.suggestions[suggestionIndex] : "First, notice what you need."}</h3>
            <div className="suggestion-bottom"><p>{activeMood ? "Take it or leave it. This is only an invitation." : "A mood suggestion will appear after your check-in."}</p><button className="round-next" type="button" aria-label="Show another suggestion" onClick={nextSuggestion} disabled={!activeMood}><ChevronRight size={17} /></button></div>
          </section>

          <section className="emoji-section" aria-labelledby="emoji-title">
            <div className="emoji-section-top"><div><p className="section-kicker small">TELL THE MIRROR WHAT YOU NEED</p><h3 id="emoji-title">Pick your mood <span>↘</span></h3></div><span className="emoji-hint">TAP TO CHOOSE</span></div>
            <div className="emoji-tray" role="group" aria-label="Choose your mood">
              {MOODS.map((mood) => <button key={mood.id} className={`emoji-choice ${manualMood === mood.id ? "selected" : ""}`} type="button" aria-label={`Choose ${mood.label}`} aria-pressed={manualMood === mood.id} onClick={() => chooseMood(mood.id)} style={{ "--emoji-color": mood.color } as React.CSSProperties}><span>{mood.emoji}</span><small>{mood.label}</small></button>)}
            </div>
          </section>

          <section className="music-card" aria-labelledby="music-title">
            <div className="music-icon"><Headphones size={20} /></div>
            <div className="music-copy"><div className="music-title-row"><h3 id="music-title">A sound to shift the air</h3><span className="optional-tag">OPTIONAL</span></div><p>Soft, original ambient tones, made here in your browser.</p></div>
            <button className={`music-toggle ${musicPlaying ? "playing" : ""}`} type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Pause ambient music" : "Play ambient music"}>
              {musicPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>
            {musicError && <p className="music-error" role="alert">{musicError}</p>}
            <div className="volume-row"><span className={`music-wave ${musicPlaying ? "wave-on" : ""}`} aria-hidden="true"><i /><i /><i /><i /><i /></span><span className="track-label">{musicPlaying ? `TUNED FOR ${activeMood?.label.toUpperCase() ?? "CALM"}` : "GENTLE AMBIENT"}</span><Volume2 size={14} /><input aria-label="Ambient music volume" type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(event) => setMusicVolume(Number(event.target.value))} /></div>
            <p className="music-disclaimer"><Music2 size={12} /> Plays only when you press play. No external audio is streamed.</p>
          </section>
        </aside>
      </section>

      <section className="how-it-works" id="how-it-works" aria-labelledby="how-title">
        <div className="how-heading"><p className="eyebrow">A SMALL NOTE ON HOW IT WORKS</p><h2 id="how-title">Curious, not certain.</h2></div>
        <div className="how-copy"><p>When you choose to start, the mirror looks at facial-expression signals in your live camera feed using an on-device model. The broad mood cue is an estimate—not a diagnosis, not a measure of your wellbeing, and not a substitute for how you describe your own feelings.</p><p>Your video is processed in this browser and is not recorded, uploaded, or stored. If the mirror gets it wrong, choose an emoji that feels closer. Your read of yourself comes first.</p></div>
        <div className="how-stamp"><Check size={15} /> PRIVATE BY DESIGN</div>
      </section>

      <footer className="footer"><span>mira<span>.</span> <small>TAKE WHAT HELPS. LEAVE THE REST.</small></span><span>MADE FOR A MOMENT OF YOU</span></footer>
    </main>
  );
}
