document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const colorPicker = document.getElementById("colorPicker");
  const lineWidthInput = document.getElementById("lineWidth");
  const clearBtn = document.getElementById("clearBtn");
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const exportBtn = document.getElementById("exportBtn");
  const penTool = document.getElementById("penTool");
  const eraserTool = document.getElementById("eraserTool");
  const coordsDisplay = document.getElementById("coords");

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  let camera = { x: 0, y: 0, zoom: 1 };
  let isPanning = false;
  let isDrawing = false;
  let isSpacePressed = false;
  let lastPointer = { x: 0, y: 0 };
  let tool = "pen";

  let paths = [];
  let history = [];
  let redoStack = [];
  let currentPath = null;
  let currentColor = "#1e1e1e";
  let currentWidth = 4;

  function screenToWorld(sx, sy) {
    let wx = (sx - width / 2) / camera.zoom + camera.x;
    let wy = (sy - height / 2) / camera.zoom + camera.y;
    return { x: wx, y: wy };
  }

  function saveState() {
    history.push(JSON.stringify(paths));
    redoStack = [];
    if (history.length > 50) {
      history.shift();
    }
    localStorage.setItem("infiniteCanvasData", JSON.stringify(paths));
  }

  function loadState() {
    let data = localStorage.getItem("infiniteCanvasData");
    if (data) {
      paths = JSON.parse(data);
      history.push(JSON.stringify(paths));
    }
  }

  window.addEventListener("resize", function () {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    requestRender();
  });

  window.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      isSpacePressed = true;
      canvas.classList.add("panning");
    }
    if (e.ctrlKey && e.code === "KeyZ") {
      if (history.length > 1) {
        redoStack.push(history.pop());
        paths = JSON.parse(history[history.length - 1]);
        requestRender();
      }
    }
    if (e.ctrlKey && e.code === "KeyY") {
      if (redoStack.length > 0) {
        let state = redoStack.pop();
        history.push(state);
        paths = JSON.parse(state);
        requestRender();
      }
    }
  });

  window.addEventListener("keyup", function (e) {
    if (e.code === "Space") {
      isSpacePressed = false;
      if (!isPanning) {
        canvas.classList.remove("panning");
      }
    }
  });

  penTool.addEventListener("click", function () {
    tool = "pen";
    penTool.classList.add("active");
    eraserTool.classList.remove("active");
  });

  eraserTool.addEventListener("click", function () {
    tool = "eraser";
    eraserTool.classList.add("active");
    penTool.classList.remove("active");
  });

  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId);
    if (
      e.button === 1 ||
      isSpacePressed ||
      e.button === 2 ||
      (e.pointerType === "touch" && e.isPrimary === false)
    ) {
      isPanning = true;
      lastPointer = { x: e.clientX, y: e.clientY };
      canvas.classList.add("panning");
      e.preventDefault();
    } else if (e.button === 0 && !isSpacePressed) {
      isDrawing = true;
      let worldPos = screenToWorld(e.clientX, e.clientY);
      currentPath = {
        points: [worldPos],
        color: tool === "eraser" ? "#1a1a24" : currentColor,
        width: tool === "eraser" ? currentWidth * 3 : currentWidth,
        isEraser: tool === "eraser",
      };
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    let worldPos = screenToWorld(e.clientX, e.clientY);
    coordsDisplay.textContent =
      "X: " + Math.round(worldPos.x) + ", Y: " + Math.round(worldPos.y);

    if (isPanning) {
      let dx = (e.clientX - lastPointer.x) / camera.zoom;
      let dy = (e.clientY - lastPointer.y) / camera.zoom;
      camera.x -= dx;
      camera.y -= dy;
      lastPointer = { x: e.clientX, y: e.clientY };
      requestRender();
    } else if (isDrawing && currentPath) {
      currentPath.points.push(worldPos);
      requestRender();
    }
  });

  canvas.addEventListener("pointerup", function (e) {
    if (isPanning) {
      isPanning = false;
      if (!isSpacePressed) {
        canvas.classList.remove("panning");
      }
    } else if (isDrawing) {
      isDrawing = false;
      if (currentPath && currentPath.points.length > 1) {
        paths.push(currentPath);
        saveState();
      }
      currentPath = null;
      requestRender();
    }
  });

  canvas.addEventListener("pointerleave", function (e) {
    if (isPanning) {
      isPanning = false;
      canvas.classList.remove("panning");
    }
    if (isDrawing && currentPath) {
      isDrawing = false;
      if (currentPath.points.length > 1) {
        paths.push(currentPath);
        saveState();
      }
      currentPath = null;
      requestRender();
    }
  });

  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  canvas.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      let zoomFactor = 0.9;
      let mousePos = screenToWorld(e.clientX, e.clientY);

      if (e.deltaY < 0) {
        camera.zoom /= zoomFactor;
      } else {
        camera.zoom *= zoomFactor;
      }

      let newMousePos = screenToWorld(e.clientX, e.clientY);
      camera.x += mousePos.x - newMousePos.x;
      camera.y += mousePos.y - newMousePos.y;

      requestRender();
    },
    { passive: false },
  );

  colorPicker.addEventListener("input", function (e) {
    currentColor = e.target.value;
    tool = "pen";
    penTool.classList.add("active");
    eraserTool.classList.remove("active");
  });

  lineWidthInput.addEventListener("input", function (e) {
    currentWidth = parseInt(e.target.value);
  });

  clearBtn.addEventListener("click", function () {
    paths = [];
    currentPath = null;
    saveState();
    requestRender();
  });

  undoBtn.addEventListener("click", function () {
    if (history.length > 1) {
      redoStack.push(history.pop());
      paths = JSON.parse(history[history.length - 1]);
      localStorage.setItem("infiniteCanvasData", JSON.stringify(paths));
      requestRender();
    }
  });

  redoBtn.addEventListener("click", function () {
    if (redoStack.length > 0) {
      let state = redoStack.pop();
      history.push(state);
      paths = JSON.parse(state);
      localStorage.setItem("infiniteCanvasData", JSON.stringify(paths));
      requestRender();
    }
  });

  exportBtn.addEventListener("click", function () {
    let link = document.createElement("a");
    link.download = "infinite-canvas.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  let renderScheduled = false;
  function requestRender() {
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(function () {
        render();
        renderScheduled = false;
      });
    }
  }

  function drawGrid() {
    let baseGridSize = 50;
    let gridSize = baseGridSize;
    while (gridSize * camera.zoom < 20) {
      gridSize *= 5;
    }
    while (gridSize * camera.zoom > 200) {
      gridSize /= 5;
    }

    let startWorld = screenToWorld(0, 0);
    let endWorld = screenToWorld(width, height);

    let startX = Math.floor(startWorld.x / gridSize) * gridSize;
    let startY = Math.floor(startWorld.y / gridSize) * gridSize;

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";

    for (let x = startX; x <= endWorld.x; x += gridSize) {
      for (let y = startY; y <= endWorld.y; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function render() {
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, width, height);
    ctx.save();

    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    drawGrid();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let allPaths = currentPath ? paths.concat([currentPath]) : paths;

    allPaths.forEach(function (path) {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    ctx.restore();
  }

  loadState();
  requestRender();
});

