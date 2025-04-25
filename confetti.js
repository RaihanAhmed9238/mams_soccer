import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';

function createConfetti(scene, x, y, z) {
    const count = 1000;
    let particles = new THREE.Group();

    for (let i = 0; i < count; i++) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        let material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            transparent: true,
            opacity: 0.9
        });
        let particle = new THREE.Mesh(geometry, material);

        particle.position.set(x, y, z);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );

        particles.add(particle);
    }

    scene.add(particles);

    function updateConfetti() {
        particles.children.forEach(p => {
            p.position.add(p.velocity);
            p.velocity.y -= 0.01;
            p.material.opacity -= 0.003;
        });

        //remove confetti when it's faded out
        particles.children = particles.children.filter(p => p.material.opacity > 0);
        if (particles.children.length == 0) {
            scene.remove(particles);
        }
    }

    return updateConfetti;
}

export default createConfetti;