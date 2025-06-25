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

// Solar position in the NAIP scene
const azimuth = 148.66;
const elevation = 68.11;

// Desired display aspect ratio
const aspectRatio = 7 / 5;

const container = document.getElementById("snag-viewer");
const scene = new THREE.Scene();
scene.background = new THREE.Color("lightgrey");

const camera = new THREE.OrthographicCamera(
    -350, 350,
    350 / aspectRatio, -350 / aspectRatio,
    0.1, 3000
);
camera.zoom = 4;
camera.position.set(-40, -40, 100);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 20);
controls.update();

// Ground plane
const groundGeo = new THREE.PlaneGeometry(modelWidth, modelHeight, 150, 150);
const groundMat = new THREE.MeshStandardMaterial({side: THREE.DoubleSide});
// Overlay the NAIP texture
new THREE.TextureLoader().load('ground-texture.png', texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  groundMat.map = texture;
  groundMat.needsUpdate = true; // Ensure the material updates with the new texture
});

// Displace the ground using the DEM to simulate terrain
new THREE.TextureLoader().load('displacement.png', displacement => {
  groundMat.displacementMap = displacement;
  // Total height variation in meters of the DEM
  groundMat.displacementScale = 11.930054;
  groundMat.needsUpdate = true; // Ensure the material updates with the new displacement map
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.receiveShadow = true;
scene.add(ground);


// Load snag model
const loader = new GLTFLoader();
loader.load('snags.glb', gltf => {
  gltf.scene.traverse(node => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.material.color.set("#b8816c");
    }
  });
  gltf.scene.position.set(-modelWidth / 2, -modelHeight / 2, 0);
  scene.add(gltf.scene);
});

// Simulate the sun position during the NAIP acquisition
const sun = new THREE.DirectionalLight(0xffffff, 5);
const sunDir = sunDirection(azimuth, elevation);
sun.position.copy(sunDir.multiplyScalar(100))
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0, 200);
scene.add(sun);

// Add a control to toggle simulated shadows
const shadowToggle = document.createElement('button');
shadowToggle.textContent = "Toggle simulated shadows";
shadowToggle.style.position = 'absolute';
shadowToggle.style.top = '10px';
shadowToggle.style.right = '10px';
shadowToggle.onclick = () => {
  sun.castShadow = !sun.castShadow;
};
container.appendChild(shadowToggle);

// Resize the canvas to fit the container
const resizeObserver = new ResizeObserver(() => {
  const width = container.clientWidth;
  const height = container.clientWidth / aspectRatio;

  renderer.setSize(width, height, false); // false avoids modifying CSS
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
resizeObserver.observe(container);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
