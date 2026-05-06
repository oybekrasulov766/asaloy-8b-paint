const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// Элементы управления
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const toolBtns = document.querySelectorAll(".tool"); // добавьте класс .tool кнопкам в HTML

// ---------- СОСТОЯНИЕ ----------
let tool = "brush";
let painting = false;
let startX = 0;
let startY = 0;
let snapshot; // Снимок для рисования фигур без "шлейфа"

let history = [];
let redoStack = [];

// ---------- ИЗМЕНЕНИЕ РАЗМЕРА ----------
function resizeCanvas() {
  // Сохраняем рисунок перед ресайзом
  const tempImage = canvas.toDataURL();
  canvas.width = window.innerWidth - 40; // Небольшой отступ
  canvas.height = window.innerHeight - 100;
  
  const img = new Image();
  img.src = tempImage;
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---------- ФУНКЦИИ ИСТОРИИ ----------
function saveState() {
  history.push(canvas.toDataURL());
  if (history.length > 30) history.shift();
  redoStack = [];
}

function restoreState(data) {
  const img = new Image();
  img.src = data;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// Первоначальное сохранение (пустой лист)
saveState();

// ---------- ОБРАБОТКА СОБЫТИЙ МЫШИ ----------
canvas.addEventListener("mousedown", (e) => {
  painting = true;
  startX = e.offsetX;
  startY = e.offsetY;

  // Делаем копию холста перед началом рисования фигуры
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.lineWidth = brushSize.value;
  ctx.strokeStyle = tool === "eraser" ? "#ffffff" : colorPicker.value;
});

canvas.addEventListener("mousemove", (e) => {
  if (!painting) return;

  const x = e.offsetX;
  const y = e.offsetY;

  if (tool === "brush" || tool === "eraser") {
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    // Для фигур: сначала восстанавливаем чистый холст из снимка
    ctx.putImageData(snapshot, 0, 0);
    
    ctx.beginPath();
    if (tool === "line") {
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
    } else if (tool === "rect") {
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (tool === "circle") {
      const r = Math.hypot(x - startX, y - startY);
      ctx.arc(startX, startY, r, 0, Math.PI * 2);
    }
    ctx.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  if (!painting) return;
  painting = false;
  saveState(); // Сохраняем только когда действие завершено
});

// ---------- КНОПКИ ----------
// Пример для Undo/Redo/Clear/Save (убедитесь, что ID совпадают с HTML)
document.getElementById("undo").onclick = () => {
  if (history.length <= 1) return;
  redoStack.push(history.pop());
  restoreState(history[history.length - 1]);
};

document.getElementById("clear").onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveState();
};