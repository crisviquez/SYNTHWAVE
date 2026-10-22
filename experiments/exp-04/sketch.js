let miSonido;
let fft;
let reproduciendo = false;

function preload() {
  // Reemplaza 'sonido.mp3' con el nombre de tu archivo de audio
  miSonido = loadSound('assets/KTHR.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES); // Usamos grados para facilitar las matemáticas circulares
  
  // Creamos el analizador de frecuencias (FFT)
  fft = new p5.FFT(0.81, 128); // Suavizado de 0.8 y 64 bandas (para que las barras se vean limpias)
  
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
}

function draw() {
  background(15, 15, 19, 40); // Efecto de rastro estético (trail suave)

  let centroX = width / 2;
  let centroY = height / 2;

  // Analizamos el espectro de audio si está sonando
  let espectro = fft.analyze();
  let volumen = fft.getEnergy("bass"); // Obtenemos la energía de los graves para pulsar el círculo

  // --- 1. DIBUJAR CÍRCULO CENTRAL PULSANTE ---
  let radioBase = 100;
  let radioPulsante = radioBase + map(volumen, 0, 255, 0, 40); // Crece con los graves

  noFill();
  stroke(255, 255, 255, 30);
  strokeWeight(2);
  circle(centroX, centroY, radioPulsante * 2.2); // Anillo exterior difuso

  // Círculo principal con gradiente visual simulado
  stroke(0, 240, 255); // Cian brillante
  strokeWeight(3);
  fill(25, 25, 35);
  circle(centroX, centroY, radioPulsante * 2);

  // --- 2. DIBUJAR ANILLO RADIAL DE FRECUENCIAS ---
  let numBarras = espectro.length * 0.8;
  let anguloPaso = 360 / numBarras;

  for (let i = 0; i < numBarras; i++) {
    let angulo = i * anguloPaso;
    let amplitud = espectro[i];
    
    // Mapeamos la amplitud de la frecuencia a la longitud de la barra
    let longitudBarra = map(amplitud, 0, 255, 0, 150);

    // Coordenadas internas (pegadas al círculo) y externas
    let x1 = centroX + cos(angulo) * radioPulsante;
    let y1 = centroY + sin(angulo) * radioPulsante;
    let x2 = centroX + cos(angulo) * (radioPulsante + longitudBarra);
    let y2 = centroY + sin(angulo) * (radioPulsante + longitudBarra);

    // Color dinámico basado en la frecuencia (de cian a magenta vibrante)
    let colorRojo = map(i, 0, numBarras, 0, 255);
    let colorAzul = map(i, 0, numBarras, 255, 100);
    stroke(colorRojo, 120, colorAzul);
    strokeWeight(4);
    
    line(x1, y1, x2, y2);
  }

  // --- 3. TEXTO DE INTERACCIÓN ---
  noStroke();
  fill(255, 255, 255, 200);
  textSize(14);
  fontFamily = "sans-serif";
  
  if (!reproduciendo) {
    text("Haz clic en cualquier lugar para reproducir", centroX, centroY + radioPulsante + 80);
  } else {
    text("Haz clic para pausar / Reproduciendo...", centroX, centroY + radioPulsante + 80);
  }
}

// Control de reproducción con clic
function mousePressed() {
  if (!reproduciendo) {
    miSonido.loop(); // Reproduce en bucle
    reproduciendo = true;
  } else {
    miSonido.pause();
    reproduciendo = false;
  }
}

// Ajustar el lienzo si cambias el tamaño de la ventana
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}