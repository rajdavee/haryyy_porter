document.addEventListener('DOMContentLoaded', () => {
    // Create floating particles
    for (let i = 0; i < 50; i++) {
        createMagicalParticle();
    }
});

function createMagicalParticle() {
    const particle = document.createElement('div');
    particle.className = 'magical-particle';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(particle);
}
