const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const zoomVal = document.getElementById("zoomVal");
const imageLoader = document.getElementById("imageLoader");

// ---------- СОСТОЯНИЕ ----------
let tool = "brush";
let painting = false;
let startX, startY;
let snapshot;
let history = [];
let redoStack = [];
let scale = 1;

// ---------- ИНИЦИАЛИЗАЦИЯ (Адаптивная) ----------
function init() {
    // Учитываем Device Pixel Ratio (для четкости на телефонах)
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth * 0.95; // 95% ширины экрана
    const displayHeight = window.innerHeight * 0.6; // 60% высоты экрана

    // Размер самого элемента в CSS пикселях
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Внутреннее разрешение холста (умножаем на dpr для четкости)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Масштабируем контекст, чтобы рисование соответствовало dpr
    ctx.scale(dpr, dpr);
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Если в истории уже что-то есть (например, после ресайза), восстанавливаем
    if (history.length > 0) {
        restoreState(history[history.length - 1]);
    } else {
        saveState(); 
    }
}

// Переинициализация при повороте экрана или изменении размера
window.addEventListener('resize', () => {
    // Чтобы рисунок не пропадал при повороте, сохраняем его
    const tempImage = canvas.toDataURL();
    init();
    restoreState(tempImage);
});

// ---------- КООРДИНАТЫ ----------
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // Важно: делим на scale, если используем зум внутри холста
    return {
        x: (clientX - rect.left) / (rect.width / canvas.width * (window.devicePixelRatio || 1)) / scale,
        y: (clientY - rect.top) / (rect.height / canvas.height * (window.devicePixelRatio || 1)) / scale
    };
}

// ---------- ЛОГИКА РИСОВАНИЯ ----------
function startDrawing(e) {
    if (tool.includes("zoom")) return;
    
    // Предотвращаем скролл страницы при рисовании на тачскрине
    if (e.type === 'touchstart') e.preventDefault();

    painting = true;
    const pos = getCoords(e);
    startX = pos.x;
    startY = pos.y;

    // Сохраняем состояние для фигур
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.lineWidth = brushSize.value;
    
    if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = colorPicker.value;
    }

    if (tool === "brush" || tool === "eraser") {
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY);
        ctx.stroke();
    }
}

function draw(e) {
    if (!painting) return;
    const pos = getCoords(e);

    if (tool === "brush" || tool === "eraser") {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    } else {
        // Фигуры
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        if (tool === "line") {
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
        } else if (tool === "rect") {
            ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
        } else if (tool === "circle") {
            const r = Math.hypot(pos.x - startX, pos.y - startY);
            ctx.arc(startX, startY, r, 0, Math.PI * 2);
        }
        ctx.stroke();
    }
}

function stopDrawing() {
    if (!painting) return;
    painting = false;
    saveState();
}

// Применение масштабирования (внутреннего)
function applyTransform() {
    // Внимание: на мобилках лучше использовать CSS zoom или transform для производительности,
    // но если нужно менять масштаб именно контекста:
    ctx.setTransform(scale * (window.devicePixelRatio || 1), 0, 0, scale * (window.devicePixelRatio || 1), 0, 0);
    zoomVal.innerText = Math.round(scale * 100) + "%";
}

// Остальные функции (saveState, restoreState, кнопки) остаются прежними...
// Не забудьте обновить обработчики для touch:
canvas.addEventListener("touchstart", startDrawing, {passive: false});
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e); }, {passive: false});
canvas.addEventListener("touchend", stopDrawing);

init();