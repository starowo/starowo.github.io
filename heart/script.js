class Particle {
    constructor(x, y, life) {
        this.x = x;
        this.y = y;
        this.life = life;
        this.motion = Math.random() * 0.7/ life;
        this.mX = x * this.motion * (Math.random() * 0.5 + 0.5);
        this.mY = y * this.motion * (Math.random() * 0.5 + 0.5);;
        this.age = 0;
        this.travelled = 0;
    }
    update(time) {
        this.age += time;
        this.travelled += Math.sqrt(this.mX * time * this.mX * time + this.mY * time * this.mY * time);
        this.x -= this.mX * time
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
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = rgbToHex(255, 140, 170);
        const flag = particles.length < 4800;
        for(let t = 0; t < 360; t += 1) {
            const coord = heart(t / 180 * Math.PI);
            ctx.beginPath();
            ctx.arc(256 + coord[0], 256 - coord[1], 2, 0, 2 * Math.PI);
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
            const particle = particles[i];
            if(particle.age >= particle.life) {
                particles.splice(i, 1);
                continue;
            }
            particles[i].update(t1);
            const clr = Math.min(255, Math.floor(160 - particle.travelled * 3));
            ctx.fillStyle = rgbToHex(255, clr, clr);
            ctx.beginPath();
            ctx.arc(256 + particle.x, 256 - particle.y, 1, 0, 2 * Math.PI);
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

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}