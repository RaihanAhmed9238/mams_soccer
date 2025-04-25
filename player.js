import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
const geometry = new THREE.SphereGeometry(5, 20, 10);
const geometry2 = new THREE.SphereGeometry(5, 20, 10);
geometry2.scale(1, 2, 1);
const geometry3 = new THREE.SphereGeometry(3, 14, 7);
const geometry4 = new THREE.SphereGeometry(3, 14, 7);
const geometry5 = new THREE.SphereGeometry(3, 14, 7);
const geometry6 = new THREE.SphereGeometry(3, 14, 7);


function isPointInQuadrilateral(quad, point) {
    // https://stackoverflow.com/questions/5922027/how-to-determine-if-a-point-is-within-a-quadrilateral
    function crossProduct(p1, p2, p3) {
        return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    }

    let wn = 0; // Winding number

    for (let i = 0; i < 4; i++) {
        let p1 = quad[i];
        let p2 = quad[(i + 1) % 4];

        if (p1.y <= point.y) {
            if (p2.y > point.y && crossProduct(p1, p2, point) > 0) {
                wn++;
            }
        } else {
            if (p2.y <= point.y && crossProduct(p1, p2, point) < 0) {
                wn--;
            }
        }
    }

    return wn !== 0;
}

let dribblingPoints = [];
for (let x = -400; x <= 400; x += 100) {
    for (let z = -200; z <= 200; z += 100) {
        let scaledZ = z * (2 / 3 + (1 / 3) * (1 - Math.abs(x) / 400));
        dribblingPoints.push({ x, z: scaledZ })
    }
}

class Player {
    mesh = [];
    constructor(x, y, z, team, number, scene, players, ball, target) {
        let item = [];
        let g = new THREE.SphereGeometry(5, 20, 10);
        const m = new THREE.MeshLambertMaterial({ color: (team == 1 ? 0x330000 : 0x333300) });
        let s = new THREE.Mesh(geometry, m);
        item.push(s);
        scene.add(s);
        s.position.set(x + 410, y + 10, z + 0);
        g = new THREE.SphereGeometry(5, 20, 10);
        g.scale(1, 2, 1);
        s = new THREE.Mesh(geometry2, m); item.push(s); scene.add(s);
        s.position.set(x + 410, y, z);
        g = new THREE.SphereGeometry(3, 14, 7);
        s = new THREE.Mesh(geometry3, m); item.push(s); scene.add(s);
        s.position.set(x + 410, y + 3, z + 5);
        g = new THREE.SphereGeometry(3, 14, 7);
        s = new THREE.Mesh(geometry4, m); item.push(s); scene.add(s);
        s.position.set(x + 410, y + 3, z - 5);
        g = new THREE.SphereGeometry(3, 14, 7);
        s = new THREE.Mesh(geometry5, m); item.push(s); scene.add(s);
        s.position.set(x + 410, y - 9, z + 4);
        g = new THREE.SphereGeometry(3, 14, 7);
        s = new THREE.Mesh(geometry6, m); item.push(s); scene.add(s);
        s.position.set(x + 410, y - 9, z - 4);
        this.mesh = item;
        this.team = team;
        this.number = number;
        this.tactic = team != 100 ? "halfDefensive" : "defensive";
        this.hasball = false;
        this.passing = false;
        this.shooting = false;
        this.position = { x, y, z };
        this.players = players;
        this.ball = ball;
        this.target = target;
        this.initClosestRanking();
    }

    initClosestRanking() {
        this.closestRanking = [[], []];
        this.xRanking = [[], []];

        for (const player of this.players) {
            if (this != player) {
                this.closestRanking[player.team].push(player);
                this.xRanking[player.team].push(player);
            }
        }
    }

    rankDistance() {
        this.closestRanking[0] = this.closestRanking[0].sort((a, b) => {
            return (a.position.x - this.position.x) ** 2 + (a.position.z - this.position.z) ** 2 < (b.position.x - this.position.x) ** 2 + (b.position.z - this.position.z) ** 2;
        });
        this.closestRanking[1] = this.closestRanking[1].sort((a, b) => {
            return (a.position.x - this.position.x) ** 2 + (a.position.z - this.position.z) ** 2 < (b.position.x - this.position.x) ** 2 + (b.position.z - this.position.z) ** 2;
        });
        this.xRanking[0] = this.xRanking[0].sort((a, b) => {
            return a.position.x > b.position.x;
        });
        this.xRanking[1] = this.xRanking[1].sort((a, b) => {
            return a.position.x > b.position.x;
        });
    }

    getClosestPlayerToBallOnTeam(team) {
        let closest;
        let mindist = 1e10;
        for (const player of this.players) {
            if (player.team != team) continue;
            if (player.number == 0) continue;
            let sq = (player.position.x - this.ball.x) ** 2 + (player.position.z - this.ball.z) ** 2;
            if (sq < mindist * mindist) {
                mindist = Math.sqrt(sq);
                closest = player;
            }
        }

        return closest;
    }

    closestTeam() {
        let closest;
        let mindist = 1e10;
        for (const player of this.players) {
            let sq = (player.position.x - this.ball.x) ** 2 + (player.position.z - this.ball.z) ** 2;
            if (sq < mindist * mindist) {
                mindist = Math.sqrt(sq);
                closest = player;
            }
        }

        return closest.team;
    }

    closeEnoughToBall() {
        let pressDistance = 75;
        return (this.position.x - this.ball.x) ** 2 + (this.position.z - this.ball.z) ** 2 < pressDistance * pressDistance;
    }

    getTarget() {
        let shootingRange = 150;
        let safeDist = 70;

        this.initClosestRanking();
        this.rankDistance();
        let targetGoal = this.team == 1 ? 400 : -400;
        if (this.hasball && !this.shooting && (Math.abs(this.position.x - targetGoal)) ** 2 + (this.position.z - 0) ** 2 < shootingRange * shootingRange) {
            this.shooting = true;
            this.target.position.z = -72 + Math.random() * 140;
            this.target.position.y = Math.random() * 46;
            this.target.position.x = this.team == 1 ? 410 : -410;
            let d = { x: (this.target.position.x - this.ball.x), y: (this.target.position.y - this.ball.y), z: (this.target.position.z - this.ball.z) };
            d.x += 50 * (Math.random() - 0.5) * (this.team == 1 ? 1 : -1);
            d.y += 60 * (Math.random() - 0.5);
            d.z += 50 * (Math.random() - 0.5);
            let dist = Math.sqrt(d.x * d.x + d.y + d.y);
            let time = dist / 2;
            this.ball.yvel = (d.y - 1 / 2 * -0.1 * time * time) / time;
            this.ball.xvel = 2 * d.x / dist;
            this.ball.zvel = 2 * d.z / dist;
            this.hasball = false;
            return new THREE.Vector2(this.ball.x, this.ball.z);

        } else {
            this.shooting = false;
            if (this.hasball) {
                for (const pt of dribblingPoints) {
                    let dribblingx = pt.x;
                    let dribblingz = pt.z;
                    if (this.team == 0) {
                        if (dribblingx > this.position.x - 50) {
                            continue;
                        }
                    }
                    else {
                        if (dribblingx < this.position.x + 50) {
                            continue;
                        }
                    }

                    let pt1 = { x: this.position.x + safeDist / 2, z: this.position.z };
                    let pt2 = { x: this.position.x - safeDist / 2, z: this.position.z };
                    let pt3 = { x: dribblingx + safeDist / 2, z: dribblingz };
                    let pt4 = { x: dribblingx - safeDist / 2, z: dribblingz };
                    let dribble = true;
                    for (const player of this.players) {
                        if (isPointInQuadrilateral([pt1, pt2, pt3, pt4], player.position)) {
                            dribble = false; break;
                        }
                    }
                    if (dribble) {
                        let dx = dribblingx - this.position.x;
                        let dz = dribblingz - this.position.z;
                        if (dx < 10 && dz < 10) {
                            continue;
                        }
                        let len = Math.sqrt(dx * dx + dz * dz);
                        dx /= len; dz /= len;
                        return new THREE.Vector2(this.position.x + dx * 50, this.position.z + dz * 50);
                    }

                }
                this.hasball = false;
                this.passing = true;
                let minPassingDist = 50;
                let len = -1;
                let i = 1;
                let dx, dz;
                while (len < minPassingDist || i == this.closestRanking[this.team].length) {
                    let target = this.closestRanking[this.team][i].position;
                    dx = target.x - this.position.x;
                    dz = target.z - this.position.z;
                    len = Math.sqrt(dx * dx + dz * dz);
                    i++;
                }
                this.ball.xvel = dx / 100;
                this.ball.zvel = dz / 100;
                return new THREE.Vector2(this.ball.x, this.ball.z);

            }
            if (this.number == 0) {
                return new THREE.Vector2(this.position.x, this.position.z);
            } if (this.getClosestPlayerToBallOnTeam(this.team) == this || (this.closeEnoughToBall() && this.closestTeam() != this.team)) {
                return new THREE.Vector2(this.ball.x, this.ball.z);
            } else {
                return new THREE.Vector2(this.tacticalPos().x, this.position.z);

            }
        }
    }

    tacticalPos() {
        let team = this.team;
        let tactic = this.tactic;
        let number = this.number % 5;
        if (team == 1) {
            this.team = 0;
            let x = this.tacticalPos();
            this.team = 1;
            return (new THREE.Vector2(-x.x, x.y));
        }
        if (team == 0) {
            // idea for tactical positions from https://github.com/Pirhan/soccer-game-ai
            switch (tactic) {
                case "offensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(350, 0);
                        case 1:
                            return new THREE.Vector2(150, 100);
                        case 2:
                            return new THREE.Vector2(150, -100);
                        case 3:
                            return new THREE.Vector2(-130, 100);
                        case 4:
                            return new THREE.Vector2(-130, -100);
                    }
                    break;
                }
                case "halfOffensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(350, 0);
                        case 1:
                            return new THREE.Vector2(200, 0);
                        case 2:
                            return new THREE.Vector2(100, 0);
                        case 3:
                            return new THREE.Vector2(-90, 100);
                        case 4:
                            return new THREE.Vector2(-90, -100);
                    }
                    break;
                }
                case "defensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(350, 0);
                        case 1:
                            return new THREE.Vector2(250, 100);
                        case 2:
                            return new THREE.Vector2(250, -100);
                        case 3:
                            return new THREE.Vector2(50, 100);
                        case 4:
                            return new THREE.Vector2(50, -100);
                    }
                    break;
                }
                case "halfDefensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(350, 0);
                        case 1:
                            return new THREE.Vector2(200, 100);
                        case 2:
                            return new THREE.Vector2(200, -100);
                        case 3:
                            return new THREE.Vector2(20, 100);
                        case 4:
                            return new THREE.Vector2(20, -100);
                    }
                    break;
                }
            }
        } else if (team == 1) {
            switch (tactic) {
                case "offensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(860, 260);
                        case 1:
                            return new THREE.Vector2(520, 200);
                        case 2:
                            return new THREE.Vector2(520, 330);
                        case 3:
                            return new THREE.Vector2(220, 160);
                        case 4:
                            return new THREE.Vector2(220, 350);
                    }
                    break;
                }
                case "halfOffensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(860, 260);
                        case 1:
                            return new THREE.Vector2(720, 250);
                        case 2:
                            return new THREE.Vector2(470, 250);
                        case 3:
                            return new THREE.Vector2(320, 160);
                        case 4:
                            return new THREE.Vector2(320, 360);
                    }
                    break;
                }
                case "defensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(860, 260);
                        case 1:
                            return new THREE.Vector2(720, 200);
                        case 2:
                            return new THREE.Vector2(720, 350);
                        case 3:
                            return new THREE.Vector2(570, 100);
                        case 4:
                            return new THREE.Vector2(570, 450);
                    }
                    break;
                }
                case "halfDefensive": {
                    switch (number) {
                        case 0:
                            return new THREE.Vector2(860, 260);
                        case 1:
                            return new THREE.Vector2(620, 200);
                        case 2:
                            return new THREE.Vector2(620, 330);
                        case 3:
                            return new THREE.Vector2(410, 160);
                        case 4:
                            return new THREE.Vector2(410, 360);
                    }
                    break;
                }
            }
        } else {
            throw new Error("Couldn't find the corresponding team.");
        }
    }

    setpos(x, y, z) {
        this.setx(x); this.sety(y); this.setz(z);
    }


    setx(x) {
        this.position.x = x;
        this.mesh[0].position.x = (x);
        this.mesh[1].position.x = (x);
        this.mesh[2].position.x = (x);
        this.mesh[3].position.x = (x);
        this.mesh[4].position.x = (x);
        this.mesh[5].position.x = (x);
    }
    sety(y) {
        this.position.y = x;

        this.mesh[0].position.y = (y) + 10;
        this.mesh[1].position.y = (y);
        this.mesh[2].position.y = (y) + 3;
        this.mesh[3].position.y = (y) + 3;
        this.mesh[4].position.y = (y) - 9;
        this.mesh[5].position.y = (y) - 9;
    }
    setz(z) {
        this.position.z = z;

        this.mesh[0].position.z = (z);
        this.mesh[1].position.z = (z);
        this.mesh[2].position.z = (z) + 5;
        this.mesh[3].position.z = (z) - 5;
        this.mesh[4].position.z = (z) + 4;
        this.mesh[5].position.z = (z) - 4;
    }
};


export function movePlayer(players, i, ball) {
    players[i].setx(players[i].position.x + (players[i].getTarget().x - players[i].position.x) * 0.01);
    players[i].setz(players[i].position.z + (players[i].getTarget().y - players[i].position.z) * 0.01);


    let closestDistance = 100000000;
    for (let j = 0; j < players.length; j++) {
        if (j != i) {
            if ((players[i].position.x - players[j].position.x) ** 2 + (players[i].position.z - players[j].position.z) ** 2 < 400) {
                let dx = players[j].position.x - players[i].position.x;
                let dz = players[j].position.z - players[i].position.z;
                let l = Math.sqrt(dx * dx + dz * dz);
                players[i].setx(players[i].position.x - (20 - l) * dx / l);
                players[i].setz(players[i].position.z - (20 - l) * dz / l);
            }
        }
    }
    if ((players[i].position.x - ball.x) ** 2 + (players[i].position.z - ball.z) ** 2 < 100 && ball.y < 5) {
        if (!players[i].passing) players[i].hasball = true;
    } else {
        players[i].passing = false;
    }
    if (players[i].hasball) {
        ball.x = players[i].position.x;
        ball.z = players[i].position.z;
    }
}
export default Player;
