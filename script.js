document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const colorPicker = document.getElementById("colorPicker");
  const lineWidth = document.getElementById("lineWidth");
  const clearBtn = document.getElementById("clearBtn");

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  let offset = { x: 0, y: 0 };
  let isPanning = false;
  let isDrawing = false;
  let isSpacePressed = false;
  let lastMouse = { x: 0, y: 0 };

  let paths = [];
  let currentPath = [];
  let currentColor = "#000000";
  let currentWidth = 3;

  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    render();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      isSpacePressed = true;
      canvas.classList.add("panning");
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      isSpacePressed = false;
      if (!isPanning) {
        canvas.classList.remove("panning");
      }
    }
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1 || isSpacePressed) {
      isPanning = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      canvas.classList.add("panning");
      e.preventDefault();
    } else if (e.button === 0 && !isSpacePressed) {
      isDrawing = true;
      currentPath = [
        {
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        },
      ];
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      offset.x += dx;
      offset.y += dy;
      lastMouse = { x: e.clientX, y: e.clientY };
      render();
    } else if (isDrawing) {
      currentPath.push({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
      render();
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    if (isPanning) {
      isPanning = false;
      if (!isSpacePressed) {
        canvas.classList.remove("panning");
      }
    } else if (isDrawing) {
      isDrawing = false;
      if (currentPath.length > 0) {
        paths.push({
          points: currentPath,
          color: currentColor,
          width: currentWidth,
        });
      }
      currentPath = [];
    }
  });

  canvas.addEventListener("mouseleave", () => {
    if (isDrawing) {
      isDrawing = false;
      if (currentPath.length > 0) {
        paths.push({
          points: currentPath,
          color: currentColor,
          width: currentWidth,
        });
      }
      currentPath = [];
    }
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  colorPicker.addEventListener("input", (e) => {
    currentColor = e.target.value;
  });

  lineWidth.addEventListener("input", (e) => {
    currentWidth = parseInt(e.target.value);
  });

  clearBtn.addEventListener("click", () => {
    paths = [];
    currentPath = [];
    render();
  });

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(offset.x, offset.y);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    paths.forEach((path) => {
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

    if (currentPath.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  render();
});


