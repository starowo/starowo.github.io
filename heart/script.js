class Particle {
    constructor(x, y, life) {
        this.x = x;
        this.y = y;
        this.life = life;
        this.motion = Math.random() * 0.5/ life;
        this.mX = x * this.motion;
        this.mY = y * this.motion;
        this.age = 0;
    }
    update(time) {
        this.age += time;
        this.x -= this.mX * time;
        this.y -= this.mY * time;
    }
}
$(() => {
    const canvas = document.getElementsByTagName("canvas")[0];
    const ctx = canvas.getContext("2d");
    let time = Date.now();
    const particles = [];
    draw();
    function draw() {
        ctx.clearRect(0, 0, 512, 512);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = "pink";
        const flag = particles.length < 3600;
        for(let t = 0; t < 360; t += 1) {
            const coord = heart(t / 180 * Math.PI);
            ctx.beginPath();
            ctx.arc(256 + coord[0], 256 - coord[1], 1, 0, 2 * Math.PI);
            //ctx.fillRect(256 + particles[i].x, 256 - particles[i].y, 1, 1);
            ctx.fill();
            ctx.closePath();
            if(flag) {
                particles.push(new Particle(coord[0], coord[1], Math.random() * 2000));
            }
        }
        let t = Date.now();
        let t1 = t - time;
        time = t;
        for(let i = particles.length - 1; i >= 0; i--) {
            if(particles[i].age >= particles[i].life) {
                particles.splice(i, 1);
                continue;
            }
            particles[i].update(t1);
            ctx.beginPath();
            ctx.arc(256 + particles[i].x, 256 - particles[i].y, 1, 0, 2 * Math.PI);
            //ctx.fillRect(256 + particles[i].x, 256 - particles[i].y, 1, 1);
            ctx.fill();
            ctx.closePath();
        }
        requestAnimationFrame(draw);
    }
    
    function heart(t) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        return [x * 8 , y * 8];
    }

});
