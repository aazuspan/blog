import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function sunDirection(azimuthDeg, elevationDeg) {
  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const el = THREE.MathUtils.degToRad(elevationDeg);
  const x = Math.cos(el) * Math.sin(az);
  const y = Math.cos(el) * Math.cos(az);
  const z = Math.sin(el);
  return new THREE.Vector3(x, y, z).normalize();
}

// Width of the snag model scene
const modelWidth = 90;
const modelHeight = 90;
const modelCenter = new THREE.Vector3(modelWidth / 2, modelHeight / 2, 0);

const azimuth = 148.66;
const elevation = 68.11;

const sceneWidth = 700;
const sceneHeight = 500;
const scene = new THREE.Scene();
scene.background = new THREE.Color("lightgrey");

const camera = new THREE.OrthographicCamera(
    -sceneWidth / 2, sceneWidth / 2,
    sceneHeight / 2, -sceneHeight / 2,
    0.1, 3000
);
camera.zoom = 4;
camera.position.set(-40, -40, 100);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sceneWidth, sceneHeight);
renderer.shadowMap.enabled = true;
document.getElementById("snag-viewer").appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 20);
controls.update();

// Ground plane
const groundGeo = new THREE.PlaneGeometry(modelWidth, modelHeight, 150, 150);
const groundMat = new THREE.MeshStandardMaterial({side: THREE.DoubleSide});
const groundTexture = new THREE.TextureLoader().load('ground-texture.png');
groundTexture.colorSpace = THREE.SRGBColorSpace;
groundMat.map = groundTexture;
const displacementMap = new THREE.TextureLoader().load('displacement.png');
groundMat.displacementMap = displacementMap;
// The scale controls the total height variation in the displacement map. This was 
// calculated from the GeoTIFF.
groundMat.displacementScale = 11.930054;
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.receiveShadow = true;
scene.add(ground);


// Load GLB
const loader = new GLTFLoader();
loader.load('snags.glb', gltf => {
  gltf.scene.traverse(node => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.material.color.set("#b8816c");
    }
  });
  gltf.scene.position.set(-modelCenter.x, -modelCenter.y, 0);
  scene.add(gltf.scene);
});


const sun = new THREE.DirectionalLight(0xffffff, 5);
const sunDir = sunDirection(azimuth, elevation);
sun.position.copy(sunDir.multiplyScalar(100))
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0, 200);
scene.add(sun);

const shadowToggle = document.createElement('button');
shadowToggle.textContent = "Toggle simulated shadows";
shadowToggle.style.position = 'absolute';
shadowToggle.style.top = '10px';
shadowToggle.style.right = '10px';
shadowToggle.onclick = () => {
  sun.castShadow = !sun.castShadow;
};
document.getElementById("snag-viewer").appendChild(shadowToggle);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
