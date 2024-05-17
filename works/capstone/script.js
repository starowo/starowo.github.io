document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const backButton = document.querySelector('.back-button');
    const pageTransition = document.querySelector('.page-transition');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href');
            pageTransition.classList.add('active');
            setTimeout(() => {
                window.location.href = href;
            }, 1000); // Match this duration with the CSS transition duration
        });
        item.addEventListener('mouseenter', () => {
            menuItems.forEach(i => {
                if (i !== item) {
                    i.style.transform = 'scale(0.8)';
                }
            });
            item.style.transform = 'scale(1.2)';
        });

        item.addEventListener('mouseleave', () => {
            menuItems.forEach(i => {
                i.style.transform = 'scale(1)';
            });
        });
        
    });

    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            const href = backButton.getAttribute('href');
            pageTransition.classList.add('active');
            setTimeout(() => {
                window.location.href = href;
            }, 1000); // Match this duration with the CSS transition duration
        });
    }

    let prevMouseX = 0;
    let prevMouseY = 0;
    // Trail effect
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ff8000', '#ff0080', '#80ff00', '#0080ff', '#8000ff', '#00ff80', '#80ff80', '#ff8080', '#8080ff', '#80ff80', '#ff80ff', '#80ffff'];
    const trailEffect = (e) => {
        if (Math.pow(e.clientX - prevMouseX, 2) + Math.pow(e.clientY - prevMouseY, 2) < 100) {
            return;
        }
        const angle = Math.atan2(e.clientY - prevMouseY, e.clientX - prevMouseX);
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        const trail = document.createElement('div');
        trail.className = 'trail';
        trail.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(trail);

        const velocityX = Math.cos(angle) * 200 * (Math.random() * 0.5 + 0.5);
        const velocityY = Math.sin(angle) * 200 * (Math.random() * 0.5 + 0.5);
        

        trail.style.left = `${e.clientX}px`;
        trail.style.top = `${e.clientY}px`;
        trail.style.transform = `translate(-50%, -50%)`;


        let startTime;
        const gravity = 200;
        const duration = 2000;

        const animateParticle = (time) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;

            const newX = e.clientX + velocityX * (elapsed / 1000);
            const newY = e.clientY + velocityY * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2);

            trail.style.left = `${newX}px`;
            trail.style.top = `${newY}px`;
            trail.style.opacity = 1 - elapsed / duration;

            if (elapsed < duration) {
                requestAnimationFrame(animateParticle);
            } else {
                trail.remove();
            }
        };

        requestAnimationFrame(animateParticle);
    };

    document.addEventListener('mousemove', trailEffect);

    const fireworkEffect = (e) => {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = `${e.clientX}px`;
        firework.style.top = `${e.clientY}px`;
        document.body.appendChild(firework);

        const particles = [];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ff8000', '#ff0080', '#80ff00', '#0080ff', '#8000ff', '#00ff80', '#80ff80', '#ff8080', '#8080ff', '#80ff80', '#ff80ff', '#80ffff'];
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'trail';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.appendChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 100 + 100;
            const gravity = 200;

            let startTime;

            const animateFirework = (time) => {
                if (!startTime) startTime = time;
                const elapsed = time - startTime;

                const newX = velocity * Math.cos(angle) * (elapsed / 1000);
                const newY = velocity * Math.sin(angle) * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2);

                particle.style.left = `${newX}px`;
                particle.style.top = `${newY}px`;
                particle.style.opacity = 1 - elapsed / 1000;

                if (elapsed < 1000) {
                    requestAnimationFrame(animateFirework);
                } else {
                    particle.remove();
                }
            };

            requestAnimationFrame(animateFirework);
        }
        setTimeout(() => {
            firework.remove();
        }, 1000);
    }

    document.addEventListener('click', fireworkEffect);
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    container.style.opacity = 0;

    setTimeout(() => {
        container.style.transition = 'opacity 2s ease-in-out';
        container.style.opacity = 1;
    }, 100);
});
