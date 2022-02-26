import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { IcosahedronGeometry, Vector3 } from "three";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { PointsMaterial } from "three";

let health = 100
let score = 0
let container, stats;
let camera, scene, renderer;
let controls, water, sun, mesh;
let player
let player_init_pos;
let num_enemies = 3
let treasureCounter

let enemies = []
let treasure_chests = []

let playerCanons = []
let enemyCanons = []

let TICKS = 0;

let RIGHT_LIMIT = 7000
let LEFT_LIMIT = -7000
let FORWARD_LIMIT = -7000
let BACKWARD_LIMIT = 7000

let time = 0
let treasures_collected = 0
let ships_destroyed = 0
let game = true

var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;

var releasePlayerCanonFlag = false;
var lastPlayerCanonRelease = 0

let view
view = true // third person view by default


//to load glb files
let loadModel = (file) => {
    return new Promise(resolve => {
        return new THREE.GLTFLoader().load(file, resolve);
    })
}

//to load gltf files
let loadGLTF = (file) => {
    return new Promise((resolve) => {
        return new GLTFLoader().load(file, resolve);
    });
}

class Player {

    constructor(position) {

        //load the 3d model (gltf folder) for player ship
        let promise = loadGLTF('../models/viking_ship/scene.gltf').then((res) => this.model = res.scene);

        // After model is loaded
        Promise.all([promise]).then(() => {
            scene.add(this.model);

            //the object's local scale, default is Vector3( 1, 1, 1 )
            this.model.scale.set(2.0, 2.0, 2.0)
            this.model.position.set(0, 0, 0)
            // this.model.rotation.y = 275 * (Math.PI / 180)

            //box geometry around the player_ship
            this.box = {
                width: 20,
                height: 25,
                depth: 25,
                x: this.model.position.x,
                y: this.model.position.y,
                z: this.model.position.z
            }

            this.translateSpeed = 0.5;
            this.rotationSpeed = 0.025;
        }, undefined, function (error) {
            console.error(error);
        });
    }

    moveRight() {
        this.model.rotation.y -= this.rotationSpeed
    }

    moveLeft() {
        this.model.rotation.y += this.rotationSpeed
    }

    moveForward() {
        // move front
        if (this.model.position.z - this.translateSpeed > FORWARD_LIMIT) {
            // this.model.position.z = this.model.position.z - this.speed
            // this.updateHitbox()
            this.model.translateZ(-1 * this.translateSpeed);
        }
    }
    moveBackward() {
        // move back
        if (this.model.position.z + this.translateSpeed < BACKWARD_LIMIT) {
            // this.model.position.z = this.model.position.z + this.speed
            // this.updateHitbox()
            this.model.translateZ(this.translateSpeed);
        }
    }

}


class Enemy {
    constructor(position) {
        let promise = loadGLTF('../models/enemy_ship/scene.gltf').then((res) => this.model = res.scene);

        // After model is loaded
        Promise.all([promise]).then(() => {

            this.model.scale.set(0.06, 0.06, 0.06)
            this.model.position.set(position.x, 0, position.z);
            scene.add(this.model);

            this.box = {
                width: 20,
                height: 25,
                depth: 25,
                x: this.model.position.x,
                y: this.model.position.y,
                z: this.model.position.z
            }
            this.speed = 0.2
            this.dead = false
            this.approachtime = 0.001

        }, undefined, function (error) {
            console.error(error);
        });

    }

    move() {
        if (this.model.position.x > 0) {
            this.model.position.x -= this.speed;
        }
        else if (this.model.position.x < 0) {
            this.model.position.x += this.speed;
        }
        this.model.position.z += this.speed;
    }
}


//spawn enemies in positivez-x plane
let spawnEnemy = () => {

    //let num_enemies = 3;

    //for (var i = 0; i < num_enemies; i += 1) {

    let isXPositive = Math.random()

    let posX, posZ, pos
    if (isXPositive >= 0.5) {
        posX = Math.random() * 500
    }
    if (isXPositive < 0.5) {
        posX = Math.random() * -500
    }

    posZ = Math.random() * (-500)

    pos = new THREE.Vector3(posX, 0, posZ)
    let curr_enemy = new Enemy(pos)
    enemies.push(curr_enemy)
    //}
}


class Treasure {

    constructor(position) {
        let promise = loadGLTF('../models/chest1/scene.gltf').then((res) => this.model = res.scene);

        // After model is loaded
        Promise.all([promise]).then(() => {

            this.model.position.set(position.x, -7.5, position.z)
            this.model.scale.set(0.2, 0.2, 0.2)

            scene.add(this.model);
            this.collected = false
            this.model.rotation.y = (Math.random() * 275) * (Math.PI / 180)

        }, undefined, function (error) {
            console.error(error);
        });
    }

    //treasure chests don't move
}

let spawnTreasureChests = () => {

    //spawn treasure chests in z-x plane

    let num_treasure_chests = Math.random() * 10 + 5 //5 - 14 treasure chests

    for (var i = 0; i < num_treasure_chests; i += 1) {

        let isXPositive = Math.random()

        let posX, posZ, pos

        if (isXPositive >= 0.5) {
            posX = Math.random() * 250 + 15
        }
        if (isXPositive < 0.5) {
            posX = Math.random() * 250 + 15
        }

        let isZPositive = Math.random()

        if (isZPositive >= 0.5) {
            posZ = Math.random() * 250 + 25
        }
        if (isZPositive < 0.5) {
            posZ = Math.random() * 250 + 25
        }

        pos = new THREE.Vector3(posX, 0, posZ)

        let curr_treasure_chest = new Treasure(pos)
        treasure_chests.push(curr_treasure_chest)
    }

}

class Canon {

    constructor(position, rotation) {

        let promise = loadGLTF('../models/canon/scene.gltf').then((res) => this.model = res.scene);
        // After model is loaded

        Promise.all([promise]).then(() => {


            this.model.scale.set(2.5, 2.5, 2.5)

            this.model.position.set(position.x, 2, position.z);
            this.model.rotation.y = rotation;
            //this.model.quaternion.set(quaternion);
            scene.add(this.model);
            console.log(this.model.rotation.y)
            //console.log(this.model.quaternion)

            // scene.add(this.model);
            this.speed = 1.0
            this.alive = true //alive when released



        }, undefined, function (error) {
            console.error(error);
        });
    }

}

init();
animate();


function init() {

    container = document.getElementById('container');

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    //

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);
    camera.lookAt(scene.position);

    //

    sun = new THREE.Vector3();

    // Water

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = - Math.PI / 2;

    scene.add(water);

    // Skybox

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 2,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    function updateSun() {

        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();

        scene.environment = pmremGenerator.fromScene(sky).texture;

    }

    updateSun();

    //

    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshStandardMaterial({ roughness: 0 });

    mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    //

    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.maxPolarAngle = Math.PI * 0.495;
    // controls.target.set(0, 10, 0);
    // controls.minDistance = 40.0;
    // controls.maxDistance = 200.0;
    // controls.update();

    //

    stats = new Stats();
    // container.appendChild(stats.dom);
    window.addEventListener('resize', onWindowResize);

    player_init_pos = new THREE.Vector3(0.0, 0.0, 0.0)
    player = new Player(player_init_pos)

    num_enemies = 3;

    for (var i = 0; i < num_enemies; i += 1) {
        spawnEnemy()
    }
    spawnTreasureChests()

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    if (health <= 0) {
        document.getElementById("gameover").innerHTML = "GAME OVER";
        var delayInMilliseconds = 10000;
        game = false
        // setTimeout(function () {
        // }, delayInMilliseconds);
        // document.getElementById("gameover").innerHTML = "";
    }

    TICKS += 1
    if (TICKS % 100 == 0) {
        time += 1
    }
    if (view) {
        //third person
        update();
    }
    else {
        let relativeCameraOffset = new THREE.Vector3(0, 120, 0);
        //let cameraOffset = relativeCameraOffset.applyMatrix4(player.model.matrixWorld);

        if (player.model) {
            var cameraOffset = player.model.localToWorld(relativeCameraOffset);
            camera.position.x = cameraOffset.x;
            camera.position.y = cameraOffset.y;
            camera.position.z = cameraOffset.z;
            camera.lookAt(player.model.position);
        }
    }

    if (rightPressed) {
        player.moveRight();
    } if (leftPressed) {
        player.moveLeft();
    } if (upPressed) {
        player.moveForward();
    } if (downPressed) {
        player.moveBackward();
    }

    //move enemy ships
    // enemies.forEach(e => {
    //     if (e.model != undefined) {
    //         if (!e.dead) {
    //             e.move()
    //         }
    //     }

    // })

    // enemies.filter(e => {
    //     if (e.dead) {
    //         scene.remove(e.model)
    //         e = null
    //         //when a ship is dead spawn another one
    //         spawnEnemy()
    //         return false
    //     }
    //     return true
    // })

    // treasure_chests.filter(t => {

    //     if (t.deleted) {
    //         scene.remove(t.model)
    //         t = null
    //         treasureCounter += 1

    //         if (treasureCounter == 5) {
    //             //re spawn some chests
    //             spawnTreasureChests()
    //             //reset counter
    //             treasureCounter = 0;
    //         }
    //         return false
    //     }
    //     return true
    // })

    if (treasureCounter == 5) {
        //re spawn some chests
        spawnTreasureChests()

        //reset counter
        treasureCounter = 0;
    }

    render();
    stats.update();

    detect_collision();
    // document.getElementById("health").innerHTML = health;
    // document.getElementById("score").innerHTML = score;

    if (game) {
        document.getElementById("scoreboard").innerHTML = "HEALTH: " + health + " &emsp; SCORE: " + score + " &emsp; TIME: " + time + " &emsp; TREASURES: " + treasures_collected + " &emsp; SHIPS DESTROYED: " + ships_destroyed;
    }
    enemiesfollowplayer();

    if (releasePlayerCanonFlag) {
        //cooldown
        if (TICKS - lastPlayerCanonRelease >= 200) {

            console.log("shoot");
            lastPlayerCanonRelease = TICKS

            playerCanonCreate()
        }
    }

    playerCanons.forEach(c => {

        if (c.model) {
            if (c.alive) {
                //console.log(c.model.position);

                c.model.translateZ(-c.speed);
                //c.model.position.z -= c.speed
            }
        }

    });

    releaseEnemyCanons();

    enemyCanons.forEach(ec => {
        if (ec.model) {
            if (ec.alive) {
                //console.log(c.model.position);
                ec.model.translateZ(ec.speed);
                //c.model.position.z -= c.speed
            }
        }
    });

}

function releaseEnemyCanons() {
    if (TICKS % 400 == 0) {

        enemies.forEach(e => {
            if (e.model != undefined) {
                if (!e.dead) {
                    let canon = new Canon(e.model.position, e.model.rotation.y)
                    enemyCanons.push(canon);

                }
            }
        })

    }
}

function playerCanonCreate() {

    if (player.model) {

        // let canon = new Canon(player.model.position, player.model.quaternion)
        let canon = new Canon(player.model.position, player.model.rotation.y)
        //canon.model.position.copy(player.model.position)
        //canon.model.quaternion.copy(player.model.quaternion);
        //canon.model.rotation.y = player.model.rotation.y;

        playerCanons.push(canon);

    }
}

function update() {

    let relativeCameraOffset = new THREE.Vector3(0, 12, 30);
    //let cameraOffset = relativeCameraOffset.applyMatrix4(player.model.matrixWorld);

    if (player.model) {
        var cameraOffset = player.model.localToWorld(relativeCameraOffset);
        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = cameraOffset.z;
        camera.lookAt(player.model.position);
    }
}


function render() {

    const time = performance.now() * 0.001;

    mesh.position.y = Math.sin(time) * 20 + 5;
    mesh.rotation.x = time * 0.5;
    mesh.rotation.z = time * 0.51;

    water.material.uniforms['time'].value += 1.0 / 60.0;

    renderer.render(scene, camera);

}

window.addEventListener('keyup', keyUpHandler, false);

window.addEventListener('keydown', keyDownHandler, false);

function keyDownHandler(event) {

    if (event.keyCode == 68) {
        rightPressed = true;
    }
    else if (event.keyCode == 65) {
        leftPressed = true;
    }

    if (event.keyCode == 83) {
        downPressed = true;
    }
    else if (event.keyCode == 87) {
        upPressed = true;
    }
    else if (event.keyCode == 69) {
        //toggle
        //E
        view = !view
    }
    else if (event.keyCode == 81) {

        //Q
        releasePlayerCanonFlag = true
    }
}
function keyUpHandler(event) {

    if (event.keyCode == 68) {
        rightPressed = false;
    }
    else if (event.keyCode == 65) {
        leftPressed = false;
    }

    if (event.keyCode == 83) {
        downPressed = false;
    }
    else if (event.keyCode == 87) {
        upPressed = false;
    }
    else if (event.keyCode == 81) {

        releasePlayerCanonFlag = false
    }
}

function detect_collision() {

    if (player.model) {

        enemies.forEach(e => {
            if (e.model != undefined) {
                if (!e.dead) {
                    if (Math.abs(player.model.position.x - e.model.position.x) < 20 &&
                        Math.abs(player.model.position.z - e.model.position.z) < 20) {
                        e.dead = true
                        health -= 20
                        scene.remove(e.model)
                        ships_destroyed += 1
                        spawnEnemy()
                    }
                }
            }

        })

        treasure_chests.forEach(t => {
            if (t.model != undefined) {
                if (!t.collected) {
                    if (Math.abs(player.model.position.x - t.model.position.x) < 15 &&
                        Math.abs(player.model.position.z - t.model.position.z) < 15) {
                        t.collected = true
                        score += 10
                        treasures_collected += 1
                        scene.remove(t.model)
                        treasureCounter += 1
                    }
                }
            }

        })

        enemyCanons.forEach(c => {
            if (c.model != undefined) {
                if (c.alive) {
                    if (Math.abs(player.model.position.x - c.model.position.x) < 10 &&
                        Math.abs(player.model.position.z - c.model.position.z) < 10) {
                        c.alive = false
                        health -= 10
                        scene.remove(c.model)
                    }
                }
            }

        })
    }

    //enemy ships and canons
    enemies.forEach(e => {
        if (e.model != undefined) {
            if (!e.dead) {
                playerCanons.forEach(c => {
                    if (c.model != undefined) {
                        if (c.alive) {

                            if (Math.abs(e.model.position.x - c.model.position.x) < 10 &&
                                Math.abs(e.model.position.z - c.model.position.z) < 10) {
                                c.alive = false
                                scene.remove(c.model)
                                e.dead = true
                                scene.remove(e.model)
                                ships_destroyed += 1
                                score += 20
                                spawnEnemy()
                            }
                        }
                    }

                })
            }
        }

    })
}

function enemiesfollowplayer() {

    if (player.model) {

        enemies.forEach(e => {

            if (e.model) {

                if (!e.dead) {

                    var velX = (player.model.position.x - e.model.position.x) * e.approachtime;
                    var velZ = (player.model.position.z - e.model.position.z) * e.approachtime;

                    e.model.position.x += velX;
                    e.model.position.z += velZ;
                    e.model.lookAt(player.model.position)
                }
            }
            // e.approachtime -= 1;
        })

    }
}

//there will be 3 enemy ships approaching the player ship at all times

//collision
//player-treasure-done
//player-enemy-done

//player-canon - done
//enemy-canon - done
//press key and release canons for player ship - done
//randomly release canons from enemy - done

//handle score and health - done