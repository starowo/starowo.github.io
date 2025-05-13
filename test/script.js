$(() => {
    const canvas = document.getElementsByTagName("canvas")[0];
    const ctx = canvas.getContext("2d");

// use the getBoundingClientRect() method to get the dimensions of the canvas
var rect = canvas.getBoundingClientRect();

// use the rotate() method to rotate the canvas so that it is always facing the same direction
ctx.rotate((360 / rect.width) * Math.PI / 180);

// draw the square
ctx.fillRect(rect.width / 2 - 50, rect.height / 2 - 50, 100, 100);
});