import * as THREE from './threejs/build/three.module.js';

import Stats from './threejs/modules/jsm/libs/stats.module.js';
import { OrbitControls } from './threejs/modules/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './threejs/modules/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from './threejs/modules/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './threejs/modules/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './threejs/modules/jsm/postprocessing/UnrealBloomPass.js';


const clock = new THREE.Clock();

const container = document.getElementById('three-container');

const stats = new Stats();
container.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
// renderer.toneMapping = THREE.CineonToneMapping;
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);



// creates scene
const scene = new THREE.Scene();
const pmremGenerator = new THREE.PMREMGenerator(renderer);

scene.background = new THREE.Color(0x09030c);


// stars
const starsGeometry = new THREE.BufferGeometry();
const starsVertices = [];

for (let i = 0; i < 10000; i++) {

    starsVertices.push(THREE.MathUtils.randFloatSpread(1000)); // x
    starsVertices.push(THREE.MathUtils.randFloatSpread(1000)); // y
    starsVertices.push(THREE.MathUtils.randFloatSpread(1000)); // z

}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));

const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x888888 }));
scene.add(stars);
// end stars

// creates camera
const camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 20000);
camera.position.set(0, 0, -80);
if (window.innerWidth >= 1000) {
    camera.filmOffset = window.innerWidth / 384;
    camera.updateProjectionMatrix();
}

// lights
const light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set( -50, 50, 50 );
scene.add( light );

const light2 = new THREE.PointLight( 0x347deb, 10, 100 );
light2.position.set( -20, 20, -50 );
scene.add( light2 );

const light3 = new THREE.PointLight( 0x9634eb, 10, 100 );
light3.position.set( 50, -50, 0 );
scene.add( light3 );

const light4 = new THREE.PointLight( 0x347deb, 2, 100 );
light4.position.set( 50, 50, 0 );
scene.add( light4 );

const light5 = new THREE.PointLight( 0x347deb, 2, 100 );
light5.position.set( -50, -50, 0 );
scene.add( light5 );


// orbit control
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();
controls.enablePan = false;
// controls.enableZoom = false;
controls.enableDamping = true;
controls.minDistance = 50;
controls.maxDistance = 100;


// adds 3D model of earth and ISS
var iss_rot;

const loader = new GLTFLoader();
loader.load('3d/globe_export_nogrid.gltf', function (gltf) {

    const model = gltf.scene;

    model.position.set(0, 0, 0);
    model.rotateY(0.4101524);
    model.rotateX(0.4101524);
    model.scale.set(0.001, 0.001, 0.001);

    // sets specific ISS object stuff.
    iss_rot = gltf.scene.children[0].children[1]; // assing the group to a specific variable for easy access
    iss_rot.rotation.set(0, 0, 0, "YXZ"); // changes rotation order to YXZ so Latitude and Longitude works properly

    scene.add(model);
    animate();

}, undefined, function (e) {
    console.error(e);
});

// gets initial ISS data
getIssData();

// recalculates camera when resizing the window
window.onresize = function () {

    if (window.innerWidth < 1000) {
        camera.filmOffset = 0;
    } else {
        camera.filmOffset = window.innerWidth / 384;
    }

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

};

function animate() {

    requestAnimationFrame(animate);

    // gets ISS data every 5 seconds
    if (clock.getElapsedTime() > 5) {
        clock.start(); // restarts the clock
        // console.log("getting ISS data");
        getIssData();
    }

    controls.update();

    stats.update();

    renderer.render(scene, camera);

    // enable this for post processing
    // composer.render();
}

function getIssData() {
    fetch("http://api.open-notify.org/iss-now.json")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            // console.log(`rotating ISS to ${data.iss_position.latitude} and ${data.iss_position.longitude}`);
            iss_rot.rotation.x = THREE.MathUtils.degToRad(data.iss_position.latitude); // latitude
            iss_rot.rotation.y = THREE.MathUtils.degToRad(data.iss_position.longitude); // longitude

            // updates text on screen
            document.getElementById("latText").innerHTML = data.iss_position.latitude;
            document.getElementById("longText").innerHTML = data.iss_position.longitude;

        }).catch((error) => {
            // Error handling
            console.error("Error when getting ISS data:");
            console.error(error);
        });
}


// manual rotation
// document.getElementById("button").addEventListener("click", rotateISS);

// function rotateISS() {
//     var rotX = document.getElementById("rotX").value;
//     var rotY = document.getElementById("rotY").value;
//     var rotZ = document.getElementById("rotZ").value;
//     console.log(`rotating to ${rotX} ${rotY} ${rotZ}`);
//     iss_rot.rotation.x = THREE.MathUtils.degToRad(rotX);
//     iss_rot.rotation.y = THREE.MathUtils.degToRad(rotY);
//     iss_rot.rotation.z = THREE.MathUtils.degToRad(rotZ);
// }