const getColorIndices = function (x, y, width) {
  const redIndex = y * functionCanvas.width * 4 + x * 4;
  return [redIndex, redIndex + 1, redIndex + 2, redIndex + 3];
}

const getColor = function (fraction) {
  const color = d3.interpolateHcl("#f4e153", "#362142")(fraction);
  return d3.color(color);
}

const getFunctionValue = function (x, y) {
  return (x - 300) * (x - 300) + 
         (y - 100) * (y - 100) + 
         x * y +
         10000 * Math.sin(x * y / (2000 * Math.PI));
}

const getGradientVector = function (x, y) {
  const cos_term = Math.cos((x * y) / (2000 * Math.PI));
  return [
    (5 * y * cos_term) / Math.PI + 2 * x + y - 600,
    (5 * x * cos_term) / Math.PI + x + 2 * y - 200
  ];
}

const getHessianMatrix = function (x, y) {
    const pi = Math.PI;
    const pi_sq = pi * pi;
    const sin_term = Math.sin((x * y) / (2000 * pi));
    const cos_term = Math.cos((x * y) / (2000 * pi));

    return [
      [
        2 - (y * y * sin_term) / (400 * pi_sq),
        -(x * y * sin_term) / (400 * pi_sq) + (5 * cos_term) / pi + 1
      ],
      [
        -(x * y * sin_term) / (400 * pi_sq) + (5 * cos_term) / pi + 1,
        2 - (x * x * sin_term) / (400 * pi_sq)
      ]
    ];
}

const computeNormalizedFunctionValues = function (width, height) {
  var min = NaN;
  var max = NaN;

  const functionValues = [];
  for (var x = 0; x < width; x++) {
    var colValues = [];
    for (var y = 0; y < height; y++) {
      var value = getFunctionValue(x, y);
      if (!(value > min)) {
        min = value;
      }
      if (!(value < max)) {
        max = value;
      }

      colValues.push(value);
    }
    functionValues.push(colValues);
  }

  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      functionValues[x][y] = (max - functionValues[x][y]) / (max - min);
    }
  }

  return functionValues;
}

const drawReferenceGrid = function (context, transparency) {
  context.fillStyle = "#cccccc" + transparency;
  context.fillRect(-50, -50, 100, 100);

  context.fillStyle = "#888888" + transparency;
  context.fillRect(0, -50, 50, 100);

  for (var i = 0; i < 5; i++) {
    context.fillStyle = "#555555" + transparency;
    context.fillRect(-50, i * 10, 100, 5);
  }
}


const functionCanvas = document.getElementById("functionCanvas");
const functionCtx = functionCanvas.getContext("2d");

const functionColors = functionCtx.getImageData(0, 0, functionCanvas.width, functionCanvas.height);

const functionValues = computeNormalizedFunctionValues(functionCanvas.width, functionCanvas.height);

for (var x = 0; x < functionColors.width; x++) {
  for (var y = 0; y < functionColors.height; y++) {
    const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndices(x, y, functionCanvas.width);
    var color = getColor(functionValues[x][y]);
    functionColors.data[redIndex] = color.r;
    functionColors.data[greenIndex] = color.g;
    functionColors.data[blueIndex] = color.b;
    functionColors.data[alphaIndex] = 255;
  }
}

functionCtx.putImageData(functionColors, 0, 0);

functionCanvas.onmousemove = function (e) {
  const x = e.clientX;
  const y = e.clientY;
  const hessianCanvas = document.getElementById("hessianCanvas");
  const hessianCtx = hessianCanvas.getContext("2d");

  hessianCtx.setTransform(1, 0, 0, 1, 0, 0);
  hessianCtx.clearRect(0, 0, hessianCanvas.width, hessianCanvas.height);

  hessianCtx.setTransform(1, 0, 0, 1, 200, 200);
  drawReferenceGrid(hessianCtx, "33");

  const [[a, c], [b, d]] = getHessianMatrix(x, y);

  hessianCtx.setTransform(a, b, c, b, 200, 200);
  drawReferenceGrid(hessianCtx, "88");
}
