import { useEffect, useRef, useState } from 'react';
import './App.css';
import { FlightPhysics } from './modules/flightPhysics';
import { CameraManager } from './modules/camera';
import { HUDManager } from './modules/hud';
import { AudioManager } from './modules/audio';
import { createSky, updateSky } from './modules/sky';
import { createTerrain, getTerrainHeight } from './modules/terrain';
import { createWater, updateWater } from './modules/water';
import { createClouds, updateClouds } from './modules/clouds';
import { createMountains } from './modules/mountains';
import { createAirport } from './modules/airport';
import { createCity } from './modules/city';
import { createForest } from './modules/forest';
import { createAirplane } from './modules/airplane';

function App() {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [mouseSensitivity, setMouseSensitivity] = useState(1);
  const [showHUD, setShowHUD] = useState(false);

  const stateRef = useRef({
    position: new (window.THREE || {}).Vector3 ? new (window.THREE || {}).Vector3(0, 50, 0) : null,
    rotation: new (window.THREE || {}).Euler ? new (window.THREE || {}).Euler(0, 0, 0) : null,
    quaternion: new (window.THREE || {}).Quaternion ? new (window.THREE || {}).Quaternion(0, 0, 0, 1) : null,
    velocity: new (window.THREE || {}).Vector3 ? new (window.THREE || {}).Vector3(0, 0, 0) : null,
    heading: 0, pitch: 0, roll: 0, yaw: 0,
    airspeed: 0, verticalSpeed: 0,
    throttle: 0.3, lift: 0, drag: 0, thrust: 0,
    gForce: 1, isStalling: false,
    engineRPM: 0, windVolume: 0,
    cameraMode: 2, cameraTargetMode: 2, cameraTransition: 0,
    cinematicAngle: 0, cinematicRadius: 150,
    chaseOffset: new (window.THREE || {}).Vector3 ? new (window.THREE || {}).Vector3(0, 8, -35) : null,
    keys: {}, mouse: { dx: 0, dy: 0 },
    mouseSensitivity: 1, daySpeed: 0.001, timeOfDay: 0.2,
    airplane: null, propeller: null,
  });

  useEffect(() => {
    // Dynamic import of Three.js
    import('three').then(THREE => {
      window.THREE = THREE;
      initScene(THREE);
    });
  }, []);

  const initScene = async (THREE) => {
    const state = stateRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    canvasRef.current.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.0005);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(0, 8, -35);

    // State init
    state.position = new THREE.Vector3(0, 50, 0);
    state.rotation = new THREE.Euler(0, 0, 0);
    state.quaternion = new THREE.Quaternion(0, 0, 0, 1);
    state.velocity = new THREE.Vector3(0, 0, 0);
    state.chaseOffset = new THREE.Vector3(0, 8, -35);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x4a6a8a, 0.6);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a5a2a, 0.8);
    scene.add(hemiLight);
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    sunLight.position.set(2000, 1500, -1000);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 8000;
    sunLight.shadow.camera.left = -1000;
    sunLight.shadow.camera.right = 1000;
    sunLight.shadow.camera.top = 1000;
    sunLight.shadow.camera.bottom = -1000;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0x6688aa, 0.3);
    fillLight.position.set(-1000, 500, 1000);
    scene.add(fillLight);

    // Create all scene elements
    const sky = createSky(scene);
    const terrain = createTerrain(scene);
    const water = createWater(scene);
    const clouds = createClouds(scene);
    const mountains = createMountains(scene);
    const airport = createAirport(scene);
    const city = createCity(scene);
    const forest = createForest(scene, getTerrainHeight);
    const { airplane, propeller } = createAirplane(scene);
    state.airplane = airplane;
    state.propeller = propeller;
    airplane.position.copy(state.position);

    // Update terrain height function in physics
    // (already exported)

    // Managers
    const physics = new FlightPhysics(state);
    const cameraMgr = new CameraManager(camera, state);
    const hud = new HUDManager();
    const audio = new AudioManager();
    hud.init();

    // Pointer lock
    let isLocked = false;
    renderer.domElement.addEventListener('click', () => {
      if (!isLocked) {
        renderer.domElement.requestPointerLock();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      isLocked = document.pointerLockElement === renderer.domElement;
      if (isLocked) {
        setShowIntro(false);
        setShowHUD(true);
        audio.init();
        audio.startEngine();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (isLocked) {
        state.mouse.dx += e.movementX;
        state.mouse.dy += e.movementY;
      }
    });
    document.addEventListener('keydown', (e) => {
      state.keys[e.code] = true;
      if (e.code === 'Escape' && isLocked) {
        document.exitPointerLock();
        setShowPause(true);
        setShowHUD(false);
      }
      if (e.code === 'KeyR') physics.reset();
      if (e.code === 'KeyC' && isLocked) {
        state.cameraTargetMode = state.cameraMode === 2 ? 1 : 2;
        state.cameraTransition = 0;
      }
      if (e.code === 'KeyG') {
        state.position.y = state.position.y > 10 ? 50 : 2;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        // throttle up handled in physics
      }
      if (e.code === 'KeyV') {
        // volume toggle
      }
    });
    document.addEventListener('keyup', (e) => {
      state.keys[e.code] = false;
    });

    // Scroll for camera
    renderer.domElement.addEventListener('wheel', (e) => {
      if (state.cameraMode === 2) {
        state.chaseOffset.y += e.deltaY * 0.02;
        state.chaseOffset.z += e.deltaX * 0.02;
      }
    });

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = 0;
    let loaded = false;

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // FPS counter
      frameCount++;
      fpsTime += dt;
      if (fpsTime >= 1) {
        frameCount = 0;
        fpsTime = 0;
      }

      // Loading simulation
      if (!loaded) {
        if (frameCount > 10) {
          loaded = true;
          setLoading(false);
        }
      }

      // Update physics
      physics.update(dt);

      // Update propeller
      if (state.propeller) {
        state.propeller.rotation.z += dt * state.engineRPM * 0.01;
      }

      // Update camera
      cameraMgr.update(dt);

      // Update environment
      const sunDir = sunLight.position.clone().normalize();
      updateSky(sky, sunDir);
      updateWater(water, now / 1000, sunDir);
      updateClouds(clouds, dt);

      // Update audio
      audio.update(state.engineRPM, state.windVolume);

      // Update HUD
      hud.update(state);

      // Clear mouse input
      state.mouse.dx = 0;
      state.mouse.dy = 0;

      // Sync airplane position
      if (state.airplane) {
        state.airplane.position.copy(state.position);
        state.airplane.quaternion.copy(state.quaternion);
      }

      renderer.render(scene, camera);
    }

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      audio.stop();
    };
  };

  const handleStart = () => {
    setShowIntro(false);
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleResume = () => {
    setShowPause(false);
    setShowHUD(true);
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="app">
      <div ref={canvasRef} className="canvas-container" />

      {/* Loading Screen */}
      {loading && (
        <div id="loading-screen" className="loading-screen">
          <div className="loading-content">
            <h1>Flugsimulator</h1>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <p>Wird geladen...</p>
          </div>
        </div>
      )}

      {/* Intro Screen */}
      {showIntro && !loading && (
        <div id="intro-screen" className="intro-screen">
          <div className="intro-content">
            <h1>Flugsimulator</h1>
            <p className="subtitle">Ein interaktiver 3D-Flugsimulator</p>
            <button className="start-btn" onClick={handleStart}>
              Flug starten
            </button>
            <div className="intro-info">
              <p>🎮 Steuerung mit Maus und Tastatur</p>
              <p>🖱️ Klicken zum Starten</p>
              <p>⎋ ESC für Menü</p>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      {showHUD && !loading && (
        <div id="hud" className="hud visible">
          <div className="hud-left">
            <div className="hud-panel">
              <span className="hud-label">GESCHW.</span>
              <div className="speed-bar-container">
                <div id="speed-bar" className="speed-bar-fill"></div>
              </div>
              <span id="speed-value" className="hud-value">0</span>
              <span className="hud-unit">km/h</span>
            </div>
            <div className="hud-panel">
              <span className="hud-label">HÖHE</span>
              <div className="alt-bar-container">
                <div id="alt-bar" className="alt-bar-fill"></div>
              </div>
              <span id="alt-value" className="hud-value">0</span>
              <span className="hud-unit">m</span>
            </div>
          </div>

          <div className="hud-center">
            <div className="horizon-container">
              <canvas id="horizon-canvas" className="horizon-canvas"></canvas>
            </div>
            <div id="altitude-warning" className="altitude-warning" style={{ display: 'none' }}>
              ⚠ BODENBERÜHRUNG ⚠
            </div>
          </div>

          <div className="hud-right">
            <div className="hud-panel">
              <span className="hud-label">KURS</span>
              <span id="heading-value" className="hud-value large">000</span>
              <span className="hud-unit">°</span>
            </div>
            <div className="hud-panel">
              <span className="hud-label">V.S.</span>
              <div className="vsf-container">
                <div id="vsf-bar" className="vsf-bar"></div>
              </div>
              <span id="vsf-value" className="hud-value">0</span>
              <span className="hud-unit">m/s</span>
            </div>
          </div>

          <div className="hud-bottom">
            <div className="throttle-container">
              <span className="hud-label">SCHUB</span>
              <div id="throttle-bar" className="throttle-bar">
                <div id="throttle-fill" className="throttle-fill"></div>
              </div>
              <span id="throttle-value" className="hud-value">30</span>
              <span className="hud-unit">%</span>
            </div>
            <div className="gear-info">
              <span id="gear-status" className="gear-text">GEAR DOWN</span>
            </div>
            <div id="trim-display" className="trim-display">TRIM: 0.0</div>
            <div id="key-hints" className="key-hints">
              W/S: Pitch | A/D: Roll | Q/E: Yaw | Shift/Ctrl: Schub | C: Kamera | R: Reset | G: Höhe
            </div>
          </div>

          <div className="hud-top-right">
            <div className="minimap-container">
              <canvas id="minimap-canvas" className="minimap-canvas"></canvas>
            </div>
          </div>

          <div className="hud-top-left">
            <div className="camera-mode">
              Kamera: <span id="camera-mode-text">Chase</span>
            </div>
          </div>
        </div>
      )}

      {/* Pause Menu */}
      {showPause && (
        <div id="pause-menu" className="pause-menu">
          <div className="pause-content">
            <h2>Paused</h2>
            <button className="menu-btn" onClick={handleResume}>Weiter</button>
            <button className="menu-btn" onClick={handleSettings}>Einstellungen</button>
            <button className="menu-btn" onClick={() => { setShowPause(false); setShowIntro(true); setShowHUD(false); }}>
              Hauptmenü
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div id="settings-panel" className="settings-panel">
          <h3>Einstellungen</h3>
          <div className="setting-row">
            <label>Lautstärke: {Math.round(volume * 100)}%</label>
            <input type="range" min="0" max="1" step="0.01" value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))} />
          </div>
          <div className="setting-row">
            <label>Mausempfindlichkeit: {mouseSensitivity.toFixed(1)}</label>
            <input type="range" min="0.1" max="3" step="0.1" value={mouseSensitivity}
              onChange={(e) => setMouseSensitivity(parseFloat(e.target.value))} />
          </div>
          <button className="menu-btn" onClick={handleSettings}>Schließen</button>
        </div>
      )}
    </div>
  );
}

export default App;