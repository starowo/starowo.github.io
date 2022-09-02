let c = 73;
let n = 0;
let took = 0;
let r = 0;

$(() => {
    draw()
});

function draw() {
    const canvasC = document.getElementById("c16");
    const ctxC = canvasC.getContext("2d");
    const canvasN = document.getElementById("n16");
    const ctxN = canvasN.getContext("2d");
    let c1 = c;
    let n1 = n;
    ctxC.clearRect(0, 0, 400, 200);
    for(let i = 0; i < c + n; i++) {
        let x = 10 + i * 20;
        let y = 10 + Math.floor(x / 400) * 20;
        x = x % 400;
        ctxC.beginPath();
        ctxC.arc(x, y, 10, 0, 360);
        if(n1 > 0) {
            if(c1 == 0 || Math.random() < n1 / c1 || c1 == 0) {
                ctxC.stroke();
                n1--;
            }else {
                c1--;
                ctxC.fill();
            }
        }else {
            c1--
            ctxC.fill();
        }
    }
    ctxN.clearRect(0, 0, 400, 200);
    for(let i = 0; i < took; i++) {
        let x = 10 + i * 20;
        let y = 10 + Math.floor(x / 400) * 20;
        x = x % 400;
        ctxN.beginPath();
        ctxN.arc(x, y, 10, 0, 360);
        ctxN.stroke();
    }
}

function shuffle() {
    c = c + n;
    n = 0;
    for(let i = 0; i < c; i ++) {
        if(Math.random() < .5) {
            n++;
        }
    }
    c -= n;
    draw();
}

function take() {
    took += n;
    n = 0;
    draw();
}