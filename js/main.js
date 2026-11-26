
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// SCENE
// ==========================================

const container = document.getElementById('calendar-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#edf2f7');

// ==========================================
// CAMERA
// ==========================================

const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);

camera.position.set(0, 0, 5);

// ==========================================
// RENDERER
// ==========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.prepend(renderer.domElement);

// ==========================================
// LIGHTING
// ==========================================

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(3, 5, 5);
scene.add(directionalLight);

// ==========================================
// NUMBER TEXTURE
// ==========================================

function createNumberTexture(number) {
    const canvas = document.createElement('canvas');

    canvas.width = 1024;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');

    function draw(value) {
        ctx.fillStyle = '#f3f0e9';
        ctx.fillRect(0, 0, 1024, 512);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 190px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, 512, 190);

        ctx.font = '32px Arial';
        ctx.letterSpacing = '5px';
        ctx.fillText('DAYS WITHOUT INCIDENTS', 512, 365);
    }

    draw(number);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI * -1.5;
    texture.flipY = false;
    texture.flipX = false;
    texture.needsUpdate = true;

    return {
        texture,
        update: draw
    };
}

// ==========================================
// INCIDENT STATISTICS
// ==========================================

async function getIncidentStats() {

    const response = await fetch('data/incidents.json');

    if (!response.ok) {
        throw new Error('Could not load incidents.json');
    }

    const data = await response.json();

    const dates = data.incidents
        .map(incident => incident.date)
        .sort();

    if (dates.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            averageGap: null
        };
    }

    // Convert dates into local calendar dates
    const dateObjects = dates.map(date => {
        const [year, month, day] = date.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    });

    // Remove duplicate incident dates
    const uniqueDates = [...new Set(
        dateObjects.map(date => date.getTime())
    )].sort((a, b) => a - b);

    const dayMs = 24 * 60 * 60 * 1000;

    // Calculate gaps between incidents
    const gaps = [];

    for (let i = 1; i < uniqueDates.length; i++) {
        gaps.push(
            (uniqueDates[i] - uniqueDates[i - 1]) / dayMs
        );
    }

    // Current streak
    const now = new Date();

    const today = Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const lastIncident = uniqueDates[uniqueDates.length - 1];

    const currentStreak = Math.max(
        0,
        Math.floor((today - lastIncident) / dayMs)
    );

    // Longest streak, including the current streak
    const longestStreak = Math.max(
        ...gaps,
        currentStreak,
        0
    );

    // Average gap
    const averageGap = gaps.length
        ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
        : null;

    return {
        currentStreak,
        longestStreak,
        averageGap
    };
}

// ==========================================
// LOAD CALENDAR
// ==========================================

const loader = new GLTFLoader();

loader.load(
    'assets/calendar.glb',

    function (gltf) {

        const calendar = gltf.scene;

        // Create dynamic number texture
        const numberDisplay = createNumberTexture(0);

        // Find the display material
        calendar.traverse((child) => {

            if (child.isMesh) {

                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];

                materials.forEach((material) => {

                    if (material.name === 'Material.002') {

                        material.map = numberDisplay.texture;
                        material.color.set(0xffffff);
                        material.needsUpdate = true;

                        console.log('Number display connected!');
                    }

                });
            }
        });

        // Load incident statistics
        getIncidentStats()
            .then(stats => {

                numberDisplay.update(stats.currentStreak);
                numberDisplay.texture.needsUpdate = true;

                document.getElementById('longest-streak').textContent =
                    stats.longestStreak + ' days';

                document.getElementById('average-streak').textContent =
                    stats.averageGap === null
                        ? '—'
                        : stats.averageGap.toFixed(1) + ' days';

                console.log('Statistics loaded:', stats);

            })
            .catch(error => {
                console.error('Statistics error:', error);
            });

        // Original rotation
        calendar.rotation.y = THREE.MathUtils.degToRad(-90);

        // Center model
        const box = new THREE.Box3().setFromObject(calendar);
        const center = box.getCenter(new THREE.Vector3());

        calendar.position.sub(center);

        // Fit model into scene
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        if (maxDimension > 0) {
            calendar.scale.setScalar(3 / maxDimension);
        }

        scene.add(calendar);

        // ==================================
        // INTERACTIVE TILT
        // ==================================

        const maxTilt = 0.18;

        let targetX = 0;
        let targetY = 0;

        let currentX = 0;
        let currentY = 0;

        const originalX = calendar.rotation.x;
        const originalY = calendar.rotation.y;

        container.addEventListener('pointermove', (event) => {

            const rect = container.getBoundingClientRect();

            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

            targetY = -x * maxTilt;
            targetX = y * maxTilt;

        });

        container.addEventListener('pointerleave', () => {

            targetX = 0;
            targetY = 0;

        });

        window.calendarAnimation = () => {

            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;

            calendar.rotation.x = originalX + currentX;
            calendar.rotation.y = originalY + currentY;

        };
    },

    undefined,

    function (error) {
        console.error('Could not load calendar:', error);
    }
);

// ==========================================
// RESIZE
// ==========================================

window.addEventListener('resize', () => {

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

});

// ==========================================
// ANIMATION
// ==========================================

function animate() {

    requestAnimationFrame(animate);

    if (window.calendarAnimation) {
        window.calendarAnimation();
    }

    renderer.render(scene, camera);

}

animate();
