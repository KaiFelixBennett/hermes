/**
 * App.jsx - Flight Simulator Main Entry Point
 * 
 * Orchestrates all modules following Clean Architecture principles.
 * This file is responsible only for wiring components together.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import './App.css';

// Module imports
import { FlightPhysics } from './physics/FlightPhysics.js';
import { TerrainGenerator } from './environment/TerrainGenerator.js';
import { CloudGenerator } from './environment/CloudGenerator.js';
import { TreeGenerator } from './objects/TreeGenerator.js';
import { createAircraft } from './objects/Aircraft.js';
import { HUD } from './hud/HUD.js';
import { CameraController } from './camera/CameraController.js';
import { SceneBuilder } from './scenes/SceneBuilder.js';
import { createInitialState } from './state/StateFactory.js';

// ============================================================
// React Flight Simulator Component
// ============================================================
function FlightSimulator() {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef(null);
  const mouseRef = useRef({ dx: 0, dy: 0 });
  const keysRef = useRef({});
  
  // Module refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const terrainRef = useRef(null);
  const aircraftRef = useRef(null);
  const propellerRef = useRef(null);
  const physicsRef = useRef(null);
  const hudRef = useRef(null);
  const cameraCtrlRef = useRef(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // 1. Build scene
    const { scene, terrain } = SceneBuilder.build();
    sceneRef.current = scene;
    terrainRef.current = terrain;

    // 2. Create camera - positioned to see the aircraft and terrain
    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    // Position camera above and behind the aircraft start position
    camera.position.set(0, 65, 90);
    // Look at the aircraft start position
    camera.lookAt(0, 55, 0);
    cameraRef.current = camera;

    // 3. Create renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // 4. Create aircraft - on the runway area (flat terrain at y=0)
    const aircraft = createAircraft();
    aircraft.position.set(0, 55, 0); // Start above the ground
    scene.add(aircraft);
    aircraftRef.current = aircraft;

    // Find propeller
    const prop = aircraft.getObjectByName('propeller');
    if (prop) propellerRef.current = prop;

    // 5. Create flight state
    const physicsState = createInitialState(aircraft.position.clone());
    stateRef.current = physicsState;

    // 6. Create physics
    const physics = new FlightPhysics(physicsState, terrain);
    physicsRef.current = physics;

    // 7. Create camera controller
    const cameraCtrl = new CameraController(camera, canvas);
    cameraCtrlRef.current = cameraCtrl;

    // 8. Create HUD
    const hud = new HUD(canvas);
    hudRef.current = hud;

    // 9. Setup keyboard input
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      physicsState.keys[e.key] = true;
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
      physicsState.keys[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 10. Setup mouse input
    const handleMouseMove = (e) => {
      if (document.pointerLockElement === canvas) {
        physicsState.mouse.dx = e.movementX;
        physicsState.mouse.dy = e.movementY;
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', () => canvas.requestPointerLock());

    // 11. Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      hud.resize();
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let lastTime = performance.now();
    let frameCount = 0;
    let debugLogged = false;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      frameCount++;

      // Update physics
      physics.update(dt);

      // Reset mouse movement
      physicsState.mouse.dx = 0;
      physicsState.mouse.dy = 0;

      // Update aircraft position
      aircraft.position.copy(physicsState.position);
      // Update aircraft rotation from physics angles (pitch, heading, roll)
      // Three.js Euler order YXZ: Y=heading, X=pitch, Z=roll
      const euler = new THREE.Euler();
      euler.set(physicsState.pitch, physicsState.heading, physicsState.roll, 'YXZ');
      aircraft.quaternion.setFromEuler(euler);

      // Animate propeller - rotate the entire group around X axis (forward axis)
      if (propellerRef.current) {
        propellerRef.current.rotation.x += dt * physicsState.engineRPM * 0.5;
      }

      // Update camera - pass heading directly via a simple object
      cameraCtrl.update(
        physicsState.position,
        { y: physicsState.heading }
      );

      // DEBUG: Log camera and aircraft positions first frame
      if (!debugLogged) {
        debugLogged = true;
        console.log('=== FRAME 1 DEBUG ===');
        console.log('CAMERA POS:', camera.position.toArray().map(v => v.toFixed(1)));
        console.log('AIRPOS:', aircraft.position.toArray().map(v => v.toFixed(1)));
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        console.log('Camera direction:', camDir.toArray().map(v => v.toFixed(3)));
        console.log('Terrain height at (0,0):', terrain.getHeight(0, 0).toFixed(1));
        console.log('Aircraft visible?', aircraft.visible);
        console.log('Aircraft children:', aircraft.children.length);
        // Check if aircraft has bounding box
        const box = new THREE.Box3().setFromObject(aircraft);
        console.log('Aircraft bounding box:', {
          min: box.min.toArray().map(v => v.toFixed(1)),
          max: box.max.toArray().map(v => v.toFixed(1))
        });
        // Distance from camera to aircraft
        const dist = camera.position.distanceTo(aircraft.position);
        console.log('Camera-aircraft distance:', dist.toFixed(1));
      }

      // Render
      renderer.render(scene, camera);
      hud.draw(physicsState);

      // Debug logging every 60 frames
      if (frameCount % 60 === 1) {
        console.log('DEBUG F' + frameCount + ':', {
          pos: physicsState.position.toArray().map(v => v.toFixed(1)),
          vel: physicsState.velocity.toArray().map(v => v.toFixed(1)),
          pitch: physicsState.pitch.toFixed(3),
          heading: physicsState.heading.toFixed(3),
          roll: physicsState.roll.toFixed(3),
          airspeed: physicsState.airspeed.toFixed(1),
          throttle: physicsState.throttle.toFixed(2),
          camPos: camera.position.toArray().map(v => v.toFixed(1)),
          terrainH: terrain.getHeight(physicsState.position.x, physicsState.position.z).toFixed(1)
        });
      }
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', () => {});
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          margin: 0,
          padding: 0,
          cursor: 'crosshair'
        }}
      />
      <div style={{
        position: 'absolute',
        top: 15,
        left: 15,
        color: '#00ff88',
        fontFamily: 'monospace',
        fontSize: 13,
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '12px 18px',
        borderRadius: 8,
        border: '1px solid rgba(0, 255, 136, 0.2)',
        pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>✈ FLIGHT SIMULATOR</div>
        <div style={{ color: '#ffffff', marginBottom: 3 }}>🖱 Click to capture mouse</div>
        <div style={{ color: '#ffffff' }}>⎋ ESC to release</div>
      </div>
    </div>
  );
}

// ============================================================
// Main App Component
// ============================================================
function App() {
  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <FlightSimulator />
    </div>
  );
}

export default App;