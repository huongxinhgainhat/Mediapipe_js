const videoElement = document.getElementById('video');
// Khởi tạo Three.js
const overlayCanvas= document.getElementById('overlay');
//const ovcverlayCtx= overlayCanvas.getContext('2d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ánh sáng
const light = new THREE.AmbientLight(0xffffff, 2);
scene.add(light);
const dirLight= new THREE.DirectionalLight(0xffffff, 4);
dirLight.position.set(0,1,1);
scene.add(dirLight);

// Môi trường phản chiếu
const pmremGenerator = new THREE.PMREMGenerator( renderer);
pmremGenerator.compileEquirectangularShader();
//Load HDRI
new THREE.RGBELoader() // thu muc chua HDRI hoac env map
.setPath('assets/debug/')
.load('studio_small_03_4k.hdr', function(texture){
  const envMap= pmremGenerator.fromEquirectangular(texture).texture;
  scene.evironment= envMap;
  scene.background= null;
  texture.dispose();
  pmremGenerator.dispose();
});
renderer.toneMappping= THREE.ACESFilmicToneMapping;
renderer.outputEncoding= THREE.sRGBEncoding;

let ring;
const loader = new THREE.GLTFLoader();
loader.load('./assets/debug/ringn.glb', (gltf) => {
  ring = gltf.scene;
  ring.scale.set(0.001,0.001,0.001);
  scene.add(ring);}, undefined, function( error){ console.error(error);
  //console.log("Has UV:", !!ring.geometry.attributtes.uv); // xem thử mesh có `geometry.attributes.uv`
});

const landmarkPoints=[];
const pointGeometry = new THREE.SphereGeometry(0.01, 8, 8);
const pointMaterial= new THREE.MeshStandardMaterial({color: 0x00ff00});

for ( let i=0; i<21; i++){
  const point= new THREE.Mesh(pointGeometry, pointMaterial);
  scene.add(point);
  landmarkPoints.push(point);
}
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
  const videoWidth= video.videoWidth;
  const videoHeight= video.videoHeight;
  const aspectRatio= videoWidth/videoHeight;
function getLandmarkWorldPosition(landmarks, videoWidth, videoHeight, camera){
  const x= landmarks.x*2-1;
  const y= -(landmarks.y*2-1);
  const z= landmarks.z*2;
  const ndc= new THREE.Vector3(x,y,z);
  ndc.unproject(camera);
  return ndc;
}
for( let i=0; i<landmarks.length; i++){
  const lm= landmarks[i];
  const x=(lm.x-0.5)*2*aspectRatio;
  const y=-(lm.y-0.5)*2*aspectRatio; // three.js dùng tọa độ không gian 3D khoảng [-1, 1], nó mặc định canvas theo x và scale theo y nên chỉnh theo y sẽ tránh làm hình ảnh dẹp đihay kéo dài
  const z= -lm.z*0.5;
  landmarkPoints[i].position.set(x,y,z);
}
if(ring){
const lm13= landmarks[13];
const lm14= landmarks[14];
const midLandmark={
  x: (lm13.x+lm14.x)/2,
  y: (lm13.y+lm14.y)/2,
  z: (lm13.z+lm14.z)/2
};
// const lm13=landmarks[13];
// const midLandmark={
//   x: lm13.x,
//   y: lm13.y, 
//   z: lm13.z
// };
const worldPos= getLandmarkWorldPosition(midLandmark, overlayCanvas.width, overlayCanvas.height, camera);
ring.position.copy(worldPos);
}
  }
});
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
cameraUtils.start();

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();