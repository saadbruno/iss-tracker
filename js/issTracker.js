import * as THREE from './threejs/build/three.module.js';

import Stats from './threejs/modules/jsm/libs/stats.module.js';
import { OrbitControls } from './threejs/modules/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './threejs/modules/jsm/loaders/GLTFLoader.js';


const clock = new THREE.Clock();

const container = document.getElementById('three-container');

// const stats = new Stats();
// container.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
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
var earth_iss_group;

const loader = new GLTFLoader();
loader.load('3d/globe_export_nogrid.gltf', function (gltf) {

    earth_iss_group = gltf.scene;

    earth_iss_group.position.set(0, 0, 0);
    earth_iss_group.rotateY(0.4101524);
    earth_iss_group.rotateX(0.4101524);
    earth_iss_group.scale.set(0.001, 0.001, 0.001);

    

    // sets specific ISS object stuff.
    iss_rot = gltf.scene.children[0].children[1]; // assing the group to a specific variable for easy access
    iss_rot.rotation.set(0, 0, 0, "YXZ"); // changes rotation order to YXZ so Latitude and Longitude works properly

    scene.add(earth_iss_group);
    animate();

}, undefined, function (e) {
    console.error(e);
});

// earth's atmosphere using a 2D sprite
const atmoMap = new THREE.TextureLoader().load( '3d/glow_rgb.png' );
const atmoMaterial = new THREE.SpriteMaterial( { map: atmoMap, color: 0xffffff } );
atmoMaterial.depthTest = false; // needed to render sprite on top of geometry
atmoMaterial.alphaMap = new THREE.TextureLoader().load( '3d/glow_alpha.png' );
const atmoSprite = new THREE.Sprite( atmoMaterial );
atmoSprite.scale.set(16.3, 16.3, 1);
atmoSprite.renderOrder = 1; // actually render sprite on top of geometry
scene.add( atmoSprite );

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

    earth_iss_group.rotation.y += 0.0005;

    // stats.update();

    renderer.render(scene, camera);

}

function getIssData() {
    fetch("https://api.wheretheiss.at/v1/satellites/25544")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            // console.log(`rotating ISS to ${data.latitude} and ${data.longitude}`);
            iss_rot.rotation.x = THREE.MathUtils.degToRad(data.latitude); // latitude
            iss_rot.rotation.y = THREE.MathUtils.degToRad(data.longitude); // longitude

            // updates text on screen
            if (data.latitude < 0) {
                console.log(data.latitude);
                var latitude = data.latitude * -1 + "° South";
            } else {
                var latitude = data.latitude + "° North";
            }

            if (data.longitude < 0) {
                var longitude = data.longitude * -1 + "° West";
            } else {
                var longitude = data.longitude + "° East";
            }
            
            document.getElementById("latText").innerHTML = latitude;
            document.getElementById("longText").innerHTML = longitude;

        }).catch((error) => {
            // Error handling
            console.error("Error when getting ISS data:");
            console.error(error);
        });
}
