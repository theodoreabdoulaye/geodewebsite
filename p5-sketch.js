
// p5.js sketch for background animation on index.html

let particles = [];
const numParticles = 50; // Reduced for subtlety

function setup() {
    let canvasContainer = document.getElementById('p5-canvas-container');
    if (!canvasContainer) return; // Don't run if container not found (e.g. on other pages)
    
    let cnv = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    cnv.parent('p5-canvas-container'); // Attach canvas to specific div
    cnv.style('display', 'block');
    cnv.style('position', 'absolute');
    cnv.style('top', '0');
    cnv.style('left', '0');
    cnv.style('z-index', '-1');


    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(random(width), random(height)));
    }
    // Adjust background in CSS for better visibility. This sketch is subtle.
    // Or set a background in draw() if needed
}

function draw() {
    if (!document.getElementById('p5-canvas-container')) return;
    
    // Subtle background gradient or color
    // background(240, 245, 250, 50); // Very light, mostly transparent
    clear(); // Use clear for full transparency, rely on CSS for background

    for (let particle of particles) {
        particle.update();
        particle.show();
        particle.edges();
    }

    // Connect nearby particles (optional, can be performance intensive)
    // for (let i = 0; i < particles.length; i++) {
    //     for (let j = i + 1; j < particles.length; j++) {
    //         let d = dist(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
    //         if (d < 100) {
    //             stroke(0, 188, 212, map(d, 0, 100, 50, 0)); // Teal, fades with distance
    //             line(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
    //         }
    //     }
    // }
}

function windowResized() {
     let canvasContainer = document.getElementById('p5-canvas-container');
     if (!canvasContainer) return;
    resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
}

class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));
        this.acc = createVector(0, 0);
        this.r = random(2, 5); // Size of particle
        // Using GEODE theme colors for particles
        this.color = random([color(26, 35, 126, 100), color(0, 188, 212, 100), color(255, 152, 0, 100)]); // Primary, Secondary, Accent with alpha
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // Reset acceleration
        this.vel.limit(2); // Max speed
    }

    show() {
        noStroke();
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.r * 2);
    }

    edges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }
}

// Only run setup if on index.html (where p5-canvas-container exists)
// This check inside setup() is better for multi-page static sites
// document.addEventListener('DOMContentLoaded', () => {
//     if (document.getElementById('p5-canvas-container')) {
//         // p5 will be initialized globally, setup() and draw() will be called
//     }
// });
    
