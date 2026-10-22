let Cancion;
let fft;
let reproduciendo = false;

function preload(){
    Cancion = loadSound('assets/KTHR.mp3');
}


function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);

    fft = new p5.FFT(0, 128);

    textAlign(CENTER, CENTER);
}

function draw() {
    background(15);
    fill(0, 229, 255, 50)
    noStroke()

    let espectro = fft.analyze();

    for (let i =0; i < espectro.length; i++){
        let x = i * (width / espectro.length);
        let alto = map(espectro[i], 0, 255, 0, height);

        rect(x, height - alto, width / espectro.length, alto);
    }
}

function mousePressed(){
    if (!reproduciendo) {
        Cancion.loop();
        reproduciendo = true;
    } else {
        Cancion.pause();
        reproduciendo = false;
    }
}