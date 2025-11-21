import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';
import {GLTFLoader}  from 'https://unpkg.com/three@0.150.1/examples/jsm/loaders/GLTFLoader.js';
const videoElement = document.getElementById('video');

// Khởi tạo Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ánh sáng
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// Tải mô hình nhẫn
let ring;
const loader = new GLTFLoader();
loader.load('./models3D/Elegance_Unveiled_0723082019_texture.glb', function (gltf) {
  ring = gltf.scene;
  ring.scale.set(0.05, 0.05, 0.05); // Điều chỉnh kích thước nhẫn
  scene.add(ring);
});

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && ring) {
    const landmarks = results.multiHandLandmarks[0];
    const ringFingerBase = landmarks[13]; // Gốc ngón áp út

    // Chuyển đổi tọa độ từ normalized (0-1) sang không gian 3D
    const x = (ringFingerBase.x - 0.5) * 2;
    const y = -(ringFingerBase.y - 0.5) * 2;
    const z = -ringFingerBase.z;

    ring.position.set(x, y, z);
  }
  renderer.render(scene, camera);
});

// Camera
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
cameraUtils.start();
