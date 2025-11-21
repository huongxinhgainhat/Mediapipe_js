const { CubeCamera } = require("three");

//const { RGBELoader } = require("three/examples/jsm/Addons.js");
const videoElement = document.getElementById('video');
// Khởi tạo Three.js
let ringReady = false;
const scene = new THREE.Scene();
const width= window.innerWidth;
const height= window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, width/height, 0.01, 1000);
camera.position.z = 1;
const renderer = new THREE.WebGLRen-derer({ antialias: true, alpha: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// Ánh sáng
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
const dirLight= new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(0,1,1);
scene.add(dirLight);

// Môi trường phản chiếu
const pmremGenerator = new THREE.PMREMGenerator( renderer);
pmremGenerator.compileEquirectangularShader();
//Load HDRI
new THREE.RGBELoader()
.setPath('textures/') // thu muc chua HDRI hoac env map
.load('studio.hdr', function(texture){
  const envMap= pmremGenerator.fromEquirectangular(texture).texture;
  scene.evironment= envMap;
  scene.background= null;
  texture.dispose();
  pmremGenerator.dispose();
})
renderer.toneMappping= THREE.ACESFilmicToneMapping;
renderer.outputEncoding= THREE.sRGBEncoding;
// Tải mô hình nhẫn
//let ring;
//const loader = new THREE.GLTFLoader();
//loader.load('./assets/debug/ring.glb', (gltf) => {
  //ring = gltf.scene;
  //ring.scale.set(0.05, 0.05, 0.05); // Điều chỉnh kích thước nhẫn
  //scene.add(ring);
let ring;
const loader = new THREE.GLTFLoader();
loader.load("./assets/debug/ringn.glb", (gltf) => {
  ring = gltf.scene;
  ring.scale.set(0.05,0.05,0.05);
  ringReady= true;
  scene.add(ring);}, undefined, function( error){ console.error(error);
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
    // tao 21 diem
    const videoWidth=video.videoWidth;
    const videoHeight=video.videoHeight;
    const aspectRatio= videoWidth/videoHeight;
    // for( let i=0; i<landmarks.length; i++){
    //   const lm=landmarks[i];
    //   const x=(lm.x-0.5)*2*aspectRatio;
    //   const y=-(lm.y-0.5)*2*aspectRatio; // three.js dùng tọa độ không gian 3D khoảng [-1, 1], nó mặc định canvas theo x và scale theo y nên chỉnh theo y sẽ tránh làm hình ảnh dẹp đihay kéo dài
    //   const z= -lm.z;
    //   landmarkPoints[i].position.set(x,y,z);
    // }

    if(ring){
      //chuyen toa do chua hoa thanh pixel torng video
      // const lm1= landmarks[13];
      // const lm2=landmarks[14];
      //   const midx= (lm1.x+lm2.x)/2;
      //   const midy=  (lm1.y+lm2.y)/2;
      //   const midz= ( lm1.z+lm2.z)/2;
      //   const pixelx= midx*videoWidth;
      //   const pixely= midy*videoHeight;
      // // Chuyển đổi tọa độ từ normalized (0-1) sang không gian 3D
      // const screentoWorld=(x,y)=>{
      //     const worldx= x- videoWidth/2;
      //     const worldy=-( y- videoHeight/2);
      //     return [worldx, worldy];
      // };
      // const [worldx, worldy]= screentoWorld(pixelx, pixely);
      // const depthz= midz*1000;
      // //ring.position.set(worldx, worldy,depthz);
      // const vector = new THREE.Vectoe3(worldx, worldy, depthz);
      // vector.unproject(camera);
      // ring.position.lerp(vector, 0.2);
      camera.updateMatrixdWorld(true);
      const lm= landmarks[13];
      const x= (lm.x-0.5)*2;
      const y=-(lm.y-0.5)*2;
      const z= -lm.z;
      const vector= new THREE.Vector3(x,y,z);
      vector.unproject(camera);
      const camPosition = camera.position.clone();
      const direction = vector.sub(camPosition).normalize();
      const distance =( 1- z)*2.5;
      const targetPos = camPosition.clone().add(direction.multiplyScalar(distance));
      ring.position.copy(targetPos);
      // const x = (ringFingerBase.x - 0.5) * 2;
      // const y = -(ringFingerBase.y - 0.5) * 2*aspectRatio;
      // const z = -ringFingerBase.z*2;
      // // const vector= new THREE.Vector3(x,y,z);
      // // vector.unproject(camera);
      // // ring.position.lerp(vector, 0.2);
      // ring.position.set(x, y, z);
      //ring.rolation.y+=0.01;
      // const targetScale = 0.05;
      // const currentScale = ring.scale.x;
      // const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
      // ring.scale.set(newScale, newScale, newScale);
    }
  }
});
// const wrist = landmarks[0];
// camera.position.lerp(wrist.clone().add(new THREE.Vector3(0,0,1)), 0.1);
// camera.lookAt(wrist);
// Camera
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
const HOST = "https://cdn.mirrar.com/webar/2025-02-07-14-33-30/";