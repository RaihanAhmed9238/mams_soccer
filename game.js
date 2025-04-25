import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/PointerLockControls.js';

import Player, { movePlayer } from './player.js';
import createConfetti from './confetti.js';
import Ball from './ball.js';
import StorageManager from './storage.js';

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xdddddd, 1);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT);
const controls = new PointerLockControls(camera, renderer.domElement);

camera.position.set(300, 0, 50);
camera.lookAt(0, 0, 0);

scene.add(camera);
let model = null;
let ball = null;
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.skypack.dev/three@0.129.0/examples/jsm/libs/draco/gltf/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('assets/free_soccer_pitch.glb', function (gltf) {

    model = gltf.scene;
    model.position.set(-10, -195, 0);
    model.scale.set(5, 5, 5);
    scene.add(model);

}, undefined, function (e) {

    console.error(e);

});
loader.load('assets/soccer_ball.glb', function (gltf) {

    ball = gltf.scene;
    ball.scale.set(300, 300, 300);
    scene.add(ball);


}, undefined, function (e) {

    console.error(e);

});

var light = new THREE.PointLight(0xFFFFFF, 5);
light.position.set(-10, 300, 50);
scene.add(light);

var geo = new THREE.PlaneBufferGeometry(2000, 2000);
var mat = new THREE.MeshLambertMaterial({ color: 0x3f9b0b, side: THREE.DoubleSide });
var plane = new THREE.Mesh(geo, mat);
plane.translateY(-10);
plane.rotateX(- Math.PI / 2);

/* Goalie geometry */
const geometry = new THREE.SphereGeometry(5, 20, 10);
const material = new THREE.MeshLambertMaterial({ color: 0x333300 });
const sphere = new THREE.Mesh(geometry, material); 
sphere.position.set(410, 10, 0);
const geometry2 = new THREE.SphereGeometry(5, 20, 10);
geometry2.scale(1, 2, 1);
const sphere2 = new THREE.Mesh(geometry2, material);
sphere2.position.set(410, 0, 0);
const geometry3 = new THREE.SphereGeometry(3, 14, 7);
const sphere3 = new THREE.Mesh(geometry3, material);
sphere3.position.set(410, 3, 5);
const geometry4 = new THREE.SphereGeometry(3, 14, 7);
const sphere4 = new THREE.Mesh(geometry4, material); 
sphere4.position.set(410, 3, -5);
const geometry5 = new THREE.SphereGeometry(3, 14, 7);
const sphere5 = new THREE.Mesh(geometry5, material); 
sphere5.position.set(410, -9, 4);
const geometry6 = new THREE.SphereGeometry(3, 14, 7);
const sphere6 = new THREE.Mesh(geometry6, material); 
sphere6.position.set(410, -9, -4);

let players = [];

let gameBall = new Ball();

const targetg = new THREE.SphereGeometry(2, 20, 10);
const matt = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
const target = new THREE.Mesh(targetg, matt); scene.add(target);
target.position.set(410, 0, 0);


let show = true;
if (show) {
    for (let i = 0; i < 5; i++) {
        players.push(new Player(-100 * i, 0, 0, 0, i, scene, players, gameBall, target));
    }
    for (let i = 0; i < 5; i++) {
        players.push(new Player(-100 * i, 0, 0, 1, i, scene, players, gameBall, target));
    }

    for (let i = 0; i < players.length; i++) {
        players[i].setx(players[i].tacticalPos().x);
        players[i].setz(players[i].tacticalPos().y);
    }

}

const texture = new THREE.TextureLoader().load('assets/glove.png');


// This is from the threejs website's tutorial
const geometry11 = new THREE.PlaneGeometry(5, 5, 16, 16);
const material11 = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const glovePlane = new THREE.Mesh(geometry11, material11);
glovePlane.position.set(410, -5, 40);
geometry11.scale(1.5, 1.5, 1.5);
glovePlane.rotateY(1.571)
// Could be done in the future
// scene.add(glovePlane);

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let spacePressed = false;
function keyDownHandler(event) {
    if (event.code == "KeyD") {
        rightPressed = true;
    } else if (event.code == "KeyA") {
        leftPressed = true;
    }
    if (event.code == "KeyS") {
        downPressed = true;
    } else if (event.code == "KeyW") {
        upPressed = true;
    }

    if (event.code == "Space") {
        spacePressed = true;
    }
}
function keyUpHandler(event) {
    if (event.code == "KeyD") {
        rightPressed = false;
    } else if (event.code == "KeyA") {
        leftPressed = false;
    }
    if (event.code == "KeyS") {
        downPressed = false;
    } else if (event.code == "KeyW") {
        upPressed = false;
    }

    if (event.code == "Space") {
        spacePressed = false;
    }
}
let xvel = 0;
let yvel = 0;
let zvel = 0;

let scoring = false;

let touchingball;
let touchinggoal;
let touchingwall = false;
let transferSpeed;
let speed;
let spaceTime;
let mode;
let shooting;
let blocked;

let kickTime = null;;

let Storage = new StorageManager();

let goals = Storage.getState()[0];
let misses = Storage.getState()[1];
document.querySelector('#scoreboard').textContent = `${goals} - ${misses}`;
let shots = 0;
let shooterRunning = false;
let shooterShooting = false;
let shooterShot = false;
let shooterTime;

let updateConfetti = () => { };


function reset() {
    goalieStartTime = 0;
    blocked = false;
    playerx = 100;
    playery = 0;
    playerz = 0;
    moveGoalieY(0);

    moveGoalieZ(0);
    xvel = 0;
    yvel = 0;
    zvel = 0;
    gameBall.x = 0;
    gameBall.y = -7.5;
    gameBall.z = 0;
    gameBall.xvel = 0;
    gameBall.yvel = 0;
    gameBall.zvel = 0;
    scoring = false;

    touchingball = false;
    touchinggoal = false;
    touchingwall = false;
    transferSpeed = 1;
    speed = 1;
    spaceTime = null;
    mode = 'normal';
    shooting = true;
    kickTime = null;
    shooterRunning = false;
    shooterShooting = false;
    shooterShot = false;
}
document.body.addEventListener('click', function () {
    //lock mouse on screen
    controls.lock();
}, false);

function moveGoalieY(y) {
    sphere.position.y = (y) + 10;
    sphere2.position.y = (y);
    sphere3.position.y = (y) + 3;
    sphere4.position.y = (y) + 3;
    sphere5.position.y = (y) - 9;
    sphere6.position.y = (y) - 9;
}
function moveGoalieZ(z) {
    sphere.position.z = (z);
    sphere2.position.z = (z);
    sphere3.position.z = (z) + 5;
    sphere4.position.z = (z) - 5;
    sphere5.position.z = (z) + 4;
    sphere6.position.z = (z) - 4;
}
function moveGoalieX(x) {
    sphere.position.x = (x);
    sphere2.position.x = (x);
    sphere3.position.x = (x);
    sphere4.position.x = (x);
    sphere5.position.x = (x);
    sphere6.position.x = (x);
}
let goalieTarget = 0;
let goalieStartTime = 0;
let goalieStart;
let goalieMovement = {};
let goalieMoveTime = 0;
let cutsceneTime = 0;
let startingCamera;

function showMessage(txt) {
    const msg = document.getElementById('message');
    msg.textContent = txt;
    msg.style.animation = 'show 1s';
    setTimeout(() => {
        msg.style.animation = 'none';
    }, 1000);
}

function updateScore() {
    if (goals > misses) {
        let max = misses + 5 - shots / 2;
        if (goals > max) {
            showMessage("YOU WIN!");
            Storage.reset();
            goals = shots = misses = 0;
            const sc = document.getElementById('scoreboard');
            sc.textContent = goals + ' - ' + misses;
            reset();
            return;
        }
    } else if (goals < misses) {
        let max = goals + 5 - shots / 2;
        if (misses > max) {
            showMessage("YOU LOSE!");
            goals = shots = misses = 0;
            Storage.reset();
            const sc = document.getElementById('scoreboard');
            sc.textContent = goals + ' - ' + misses;
            reset();
            return;
        }
    } else if (shots == 10) {
        showMessage("SUDDEN DEATH!");
        return;
    }


    Storage.updateScore(goals, misses);
    showMessage("GOAL!");

    updateConfetti = createConfetti(scene, 350 * gameBall.x / Math.abs(gameBall.x), 10, 0);

    const sc = document.getElementById('scoreboard');
    sc.textContent = goals + ' - ' + misses;
}


let playerx = camera.position.x;
let playery = camera.position.y;
let playerz = camera.position.z;
let previousTime = Date.now();
let currentTime = previousTime + 0.03;

function render() {

    setTimeout(() => {
        requestAnimationFrame(render);
    });
    renderer.render(scene, camera);
    let dtime = 0.05 * (currentTime - previousTime);
    previousTime = currentTime;
    currentTime = Date.now();
    updateConfetti();
    if (show) {
        for (let i = 0; i < players.length; i++) {
            movePlayer(players, i, gameBall);
        }
    }

    let vel = Math.sqrt(xvel * xvel + zvel * zvel);

    camera.position.x = playerx;
    if (vel < 0.01) {
        camera.position.y = 0 + playery;
    } else {
        camera.position.y = 0 + playery + vel * dtime * Math.sin(0.0015 * 6.28 * Date.now());
        const vect = new THREE.Vector3();
        let v = camera.getWorldDirection(vect);
        camera.rotateX(1 / 180 * vel * dtime * Math.sin(0.0015 * 6.28 * Date.now()));
    }
    camera.position.z = playerz;

    if (!ball) { return; }
    if (mode != 'cutscene') {
        glovePlane.position.z = playerz;
        glovePlane.position.y = playery - 5;
        gameBall.x += gameBall.xvel * dtime;
        gameBall.z += gameBall.zvel * dtime;
        ball.rotateX(gameBall.zvel * dtime * 1 / 10);
        ball.rotateZ(-gameBall.xvel * dtime * 1 / 10);
        gameBall.xvel *= 0.99;
        gameBall.zvel *= 0.99;

        let possessor = players.find(p => p.hasball);
        let offset = 0;
        if (possessor) {
            offset = possessor.team == 0 ? -10 : 10;
        }

        if (ball) ball.position.set(gameBall.x + offset, gameBall.y, gameBall.z);

        if (possessor && spacePressed && (possessor.position.x - camera.position.x)**2 + (possessor.position.z - camera.position.z)**2 < 200) {
            possessor.hasball = false;
        }

        yvel -= 0.1;
        if (playery > 0 || yvel > 0) {
            playery += yvel * dtime;
        }
        gameBall.yvel -= 0.1 * dtime;

        if (gameBall.y > -7.5 || gameBall.yvel > 0) {
            gameBall.y += gameBall.yvel * dtime;
        } else {
            gameBall.y = -7.5;
        }
        if (gameBall.y < -5 && gameBall.y > -7.5 && gameBall.yvel < 0) {
            gameBall.yvel = -gameBall.yvel * 0.8 ** (dtime);
        }

        if (gameBall.x < -470 || gameBall.x > 447) {
            if (!touchingwall)
                gameBall.xvel = -gameBall.xvel * 0.8 ** (dtime);
            touchingwall = true;
        } else if (gameBall.z < -351 || gameBall.z > 355) {
            if (!touchingwall)
                gameBall.zvel = -gameBall.zvel * 0.8 ** (dtime);
            touchingwall = true;
        } else {
            touchingwall = false;
        }

        playerx += xvel * dtime;
        playerz += zvel * dtime;
        xvel *= 0.8 ** dtime;
        zvel *= 0.8 ** dtime;
    }
    if (mode == 'normal') {
        target.visible = false;
        const vector = new THREE.Vector3();
        let v = camera.getWorldDirection(vector).multiplyScalar(dtime);

        if (rightPressed || leftPressed || downPressed || upPressed) {
            xvel = 0;
            zvel = 0;

            if (rightPressed) {
                xvel += -v.z;
                zvel += v.x;
            } else if (leftPressed) {
                xvel += v.z;
                zvel += -v.x;
            }

            if (downPressed) {
                xvel += -v.x;
                zvel += -v.z;
            } else if (upPressed) {
                xvel += v.x;
                zvel += v.z;
            }
            let mag = Math.sqrt(xvel * xvel + zvel * zvel);
            xvel *= speed / mag;
            zvel *= speed / mag;
        }

        if (spacePressed && (!spaceTime || Date.now() - spaceTime < 500)) {
            if (!spaceTime) {
                spaceTime = Date.now();
            }
            speed = 1.5;
            transferSpeed *= 1.05;
        } else {
            speed = 1;
            transferSpeed = 1;
        }
        if (!spacePressed) {
            spaceTime = null;
        }


        if (ball && (ball.position.x - playerx) * (ball.position.x - playerx) + (ball.position.z - playerz) * (ball.position.z - playerz) < 100) {
            if (!touchingball) {
                gameBall.xvel = transferSpeed * xvel;
                gameBall.zvel = transferSpeed * zvel;
                if (spacePressed) {
                    gameBall.yvel = transferSpeed;
                    let r = 100 * Math.random() - 50;
                    sphere.position.z = (r);
                    sphere2.position.z = (r);
                    sphere3.position.z = (r) + 5;
                    sphere4.position.z = (r) - 5;
                    sphere5.position.z = (r) + 4;
                    sphere6.position.z = (r) - 4;


                }
                touchingball = true;
            }
            let dist = (ball.position.x - playerx) * (ball.position.x - playerx) + (ball.position.z - playerz) * (ball.position.z - playerz);
            dist = 10 - Math.sqrt(dist);
            let ox = (ball.position.x - playerx);
            let oz = (ball.position.z - playerz);
            let l = Math.sqrt(ox * ox + oz * oz);
            gameBall.x += dist * ox / l;
            gameBall.z += dist * oz / l;
        } else {
            touchingball = false;
        }
        if ((ball.position.y < 48 && (ball.position.x - 410) ** 2 + (ball.position.z - 69) ** 2 < 25)
            || (ball.position.y < 48 && (ball.position.x - 410) ** 2 + (ball.position.z + 73) ** 2 < 25)
            || ((ball.position.z > -73 && ball.position.z < 69) && (ball.position.x - 410) ** 2 + (ball.position.y - 46) ** 2 < 25)
            || (ball.position.y < 48 && (ball.position.x + 410) ** 2 + (ball.position.z - 69) ** 2 < 25)
            || (ball.position.y < 48 && (ball.position.x + 410) ** 2 + (ball.position.z + 73) ** 2 < 25)
            || ((ball.position.z > -73 && ball.position.z < 69) && (ball.position.x + 410) ** 2 + (ball.position.y - 46) ** 2 < 25)
        ) {
            if (touchinggoal == false) {
                touchinggoal = true;
                gameBall.xvel = -gameBall.xvel;
            }
        } else {
            touchinggoal = false;
        }
        let diff = { x: (ball.position.x - sphere.position.x), y: (ball.position.y - sphere.position.y), z: (ball.position.z - sphere.position.z) };
        if (diff.x * diff.x + diff.z * diff.z < 100) {
            if (gameBall.y + 7.5 < sphere2.position.y + 15 && gameBall.y + 7.5 > sphere2.position.y) {
                blocked = true;
            }
        }
        if (!blocked && !scoring && ball.position.z > -72 && ball.position.z < 68 && ball.position.y < 46 && (ball.position.x > 410 || ball.position.x < -410)) {
            if (ball.position.x > 0) {
                goals++;
            } else {
                misses++;
            }
            scoring = true;
            gameBall.xvel = -0.1 * Math.abs(gameBall.xvel);
            gameBall.zvel = -0.1 * gameBall.zvel;

            updateScore();
            setTimeout(() => {
                reset();
                camera.lookAt(0, 0, 0);
            }, 1000);

        } else if (!scoring && ((ball.position.x > 400 && blocked) || (kickTime && Date.now() - kickTime > 1000))) {
            scoring = true;
            if (blocked) {
                gameBall.xvel = -Math.abs(gameBall.xvel);
            }
            showMessage("MISS!");

            setTimeout(() => {
                reset();
                camera.lookAt(0, 0, 0);

            }, 1000);
        }
    }
}
reset();
render();
document.querySelector('#resetBtn').addEventListener('click', () => {
  Storage.updateScore(0, 0);
  goals = misses = 0;
  window.location.reload();
});

  document.querySelector('#helpBtn').addEventListener('click', () => {
    helpModal.style.display = 'block';
  });

  document.querySelector('#closeHelp').addEventListener('click', () => {
    helpModal.style.display = 'none';
  });
