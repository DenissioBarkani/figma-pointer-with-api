"use strict";
// Основной код плагина для Figma
// Работает в Plugin Sandbox (нет доступа к DOM)
// Конфигурация анимации (можно изменить в animation-config.ts)
// Для Figma плагинов используем прямое включение конфигурации
const CLICK_ANIMATION_CONFIG = {
    steps: 5,
    minScale: 0.9,
    maxScale: 1.1,
    phases: {
        shrink: 0.3,
        grow: 0.3,
        return: 0.4
    },
    frameDelay: 16
};
const ROTATE_ANIMATION_CONFIG = {
    duration: 1000, // 1 секунда
    returnToOriginal: false // Не возвращаем, оставляем повернутым
};
const ROTATE_180_CONFIG = {
    duration: 1000 // 1 секунда для полного цикла (180° + -180°)
};
figma.showUI(__html__, { width: 240, height: 340 });
// Глобальная переменная для хранения указки
let pointerNode = null;
// Создание изображения из байтов
function createImageFromBytes(bytes) {
    const image = figma.createImage(bytes);
    return {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: "FILL"
    };
}
// Добавление указки на Canvas
async function addPointerToCanvas(imageBytes) {
    try {
        // Создаём изображение из байтов
        const imagePaint = createImageFromBytes(imageBytes);
        // Создаём Frame для указки
        const pointerFrame = figma.createFrame();
        pointerFrame.name = "Указка";
        pointerFrame.resize(200, 200); // Размер по умолчанию, пользователь может изменить
        // Применяем изображение как фон
        pointerFrame.fills = [imagePaint];
        // Размещаем в центре viewport
        const viewport = figma.viewport.center;
        pointerFrame.x = viewport.x - 100;
        pointerFrame.y = viewport.y - 100;
        // Добавляем на текущую страницу
        figma.currentPage.appendChild(pointerFrame);
        // Создаём Component из Frame
        const component = figma.createComponent();
        component.name = "Указка";
        component.resize(pointerFrame.width, pointerFrame.height);
        component.fills = pointerFrame.fills;
        component.x = pointerFrame.x;
        component.y = pointerFrame.y;
        // Удаляем старый Frame и добавляем Component
        pointerFrame.remove();
        figma.currentPage.appendChild(component);
        // Выделяем созданный элемент
        figma.currentPage.selection = [component];
        figma.viewport.scrollAndZoomIntoView([component]);
        // Сохраняем ссылку на указку
        pointerNode = component;
        // Обновляем состояние кнопок в UI
        figma.ui.postMessage({ type: 'selection-changed', hasSelection: true });
        figma.notify("Указка добавлена на Canvas");
        return component;
    }
    catch (error) {
        figma.notify("Ошибка при добавлении указки: " + error);
        console.error(error);
    }
}
// Привязка звука к элементу
async function attachSoundToElement(nodeId, soundBytes) {
    try {
        const node = figma.getNodeById(nodeId);
        if (!node) {
            figma.notify("Элемент не найден");
            return;
        }
        // В Figma звук добавляется через Prototype Interactions
        // К сожалению, Figma Plugin API не позволяет напрямую добавлять звук через плагин
        // Звук нужно добавлять вручную в Prototype панели
        // Но мы можем сохранить информацию о звуке для пользователя
        if (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "INSTANCE") {
            // Сохраняем информацию о звуке в метаданных компонента
            // Пользователь должен будет добавить звук вручную в Prototype
            figma.notify("Элемент готов. Добавьте звук вручную в Prototype → On Click → Play Sound");
        }
        else {
            figma.notify("Выберите компонент или фрейм для привязки звука");
        }
    }
    catch (error) {
        figma.notify("Ошибка при привязке звука: " + error);
        console.error(error);
    }
}
// Создание анимации
function createAnimation(nodeId, animationType) {
    try {
        const node = figma.getNodeById(nodeId);
        if (!node) {
            figma.notify("Элемент не найден");
            return;
        }
        if (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "INSTANCE") {
            // Создаём варианты для анимации через компоненты
            switch (animationType) {
                case "bounce":
                    createBounceAnimation(node);
                    break;
                case "pulse":
                    createPulseAnimation(node);
                    break;
                case "shake":
                    createShakeAnimation(node);
                    break;
                case "emotion-wheel":
                    createEmotionWheelAnimation(node);
                    break;
                default:
                    figma.notify("Неизвестный тип анимации");
            }
        }
    }
    catch (error) {
        figma.notify("Ошибка при создании анимации: " + error);
        console.error(error);
    }
}
// Анимация Bounce (подпрыгивание)
function createBounceAnimation(node) {
    // Создаём варианты для bounce
    const component = node.type === "COMPONENT" ? node : figma.createComponent();
    // Для bounce нужны варианты с разными позициями Y
    // Упрощённая версия - создаём несколько состояний
    figma.notify("Анимация Bounce: используйте Smart Animate в Prototype");
}
// Анимация Pulse (пульсация)
function createPulseAnimation(node) {
    // Создаём варианты с разными размерами
    figma.notify("Анимация Pulse: используйте Smart Animate в Prototype");
}
// Анимация Shake (дрожание)
function createShakeAnimation(node) {
    // Создаём варианты с небольшими смещениями
    figma.notify("Анимация Shake: используйте Smart Animate в Prototype");
}
// Анимация клика (scale 0.9 → 1.1 → 1.0) - быстрая
function playClickAnimation() {
    try {
        // Пытаемся найти указку в выделении
        const selection = figma.currentPage.selection;
        let node = null;
        if (selection.length > 0) {
            node = selection[0];
        }
        else if (pointerNode && !pointerNode.removed) {
            node = pointerNode;
        }
        else {
            figma.notify("Выберите указку на Canvas");
            return;
        }
        if (node.type !== "COMPONENT" && node.type !== "FRAME" && node.type !== "INSTANCE") {
            figma.notify("Выберите компонент или фрейм");
            return;
        }
        const frame = node;
        const originalWidth = frame.width;
        const originalHeight = frame.height;
        const originalX = frame.x;
        const originalY = frame.y;
        // Отправляем команду в UI для анимации с задержками
        figma.ui.postMessage({
            type: 'animate-click',
            nodeId: node.id,
            originalWidth,
            originalHeight,
            originalX,
            originalY
        });
    }
    catch (error) {
        figma.notify("Ошибка анимации: " + error);
        console.error("Ошибка в playClickAnimation:", error);
    }
}
// Анимация вращения на 360°
function playRotate360Animation() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.notify("Выберите элемент для вращения");
        return;
    }
    const node = selection[0];
    if (node.type !== "COMPONENT" && node.type !== "FRAME" && node.type !== "INSTANCE") {
        figma.notify("Выберите компонент или фрейм");
        return;
    }
    const frame = node;
    const originalRotation = frame.rotation;
    // Отправляем команду в UI для резкой анимации вращения с bounce эффектом
    figma.ui.postMessage({
        type: 'animate-rotate',
        nodeId: node.id,
        originalRotation,
        duration: ROTATE_ANIMATION_CONFIG.duration,
        returnToOriginal: ROTATE_ANIMATION_CONFIG.returnToOriginal
    });
}
// Анимация вращения на 180° и обратно (-180°)
function playRotate180Animation() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.notify("Выберите элемент для вращения");
        return;
    }
    const node = selection[0];
    if (node.type !== "COMPONENT" && node.type !== "FRAME" && node.type !== "INSTANCE") {
        figma.notify("Выберите компонент или фрейм");
        return;
    }
    const frame = node;
    const originalRotation = frame.rotation;
    const duration = ROTATE_180_CONFIG.duration;
    const steps = 60; // 60 шагов для плавной анимации
    const stepDuration = duration / steps;
    let currentStep = 0;
    // Анимация вращения прямо в code.ts для надежности
    function animateStep() {
        if (currentStep > steps) {
            // Завершаем анимацию - возвращаемся к исходному вращению
            try {
                const node = figma.getNodeById(frame.id);
                if (node && (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "INSTANCE")) {
                    const frameNode = node;
                    frameNode.rotation = originalRotation;
                }
            }
            catch (error) {
                console.error("Ошибка завершения анимации:", error);
            }
            return;
        }
        const progress = currentStep / steps;
        let rotation;
        if (progress < 0.5) {
            // Первая половина: вращение на 180°
            const localProgress = progress / 0.5; // 0 до 1
            rotation = originalRotation + localProgress * Math.PI;
        }
        else {
            // Вторая половина: вращение обратно на -180° (возврат к исходному)
            const localProgress = (progress - 0.5) / 0.5; // 0 до 1
            rotation = originalRotation + Math.PI - localProgress * Math.PI;
        }
        try {
            const node = figma.getNodeById(frame.id);
            if (node && (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "INSTANCE")) {
                const frameNode = node;
                frameNode.rotation = rotation;
            }
        }
        catch (error) {
            console.error("Ошибка анимации вращения:", error);
            return;
        }
        currentStep++;
        setTimeout(animateStep, stepDuration);
    }
    animateStep();
}
// Анимация Emotion Wheel (вращение как нож в CS:GO)
function createEmotionWheelAnimation(node) {
    // Создаём компонент с вариантами вращения
    // Вариант 1: Быстрое вращение (как нож в CS:GO) - несколько полных оборотов
    // Вариант 2: Медленное вращение на 360 градусов - один оборот
    const parent = node.parent;
    if (!parent)
        return;
    // Сохраняем оригинальные координаты и размеры
    const originalX = node.x;
    const originalY = node.y;
    const originalWidth = node.width;
    const originalHeight = node.height;
    // Клонируем узел для создания вариантов
    const clonedNode = node.clone();
    // Создаём начальное состояние (0 градусов)
    const startFrame = figma.createFrame();
    startFrame.name = "Начало";
    startFrame.resize(originalWidth, originalHeight);
    startFrame.fills = [];
    startFrame.clipsContent = true;
    const startNode = clonedNode.clone();
    startNode.x = 0;
    startNode.y = 0;
    startFrame.appendChild(startNode);
    // Создаём конечное состояние (360 градусов)
    const endFrame = figma.createFrame();
    endFrame.name = "Конец (360°)";
    endFrame.resize(originalWidth, originalHeight);
    endFrame.fills = [];
    endFrame.clipsContent = true;
    endFrame.rotation = Math.PI * 2; // 360 градусов в радианах
    const endNode = clonedNode.clone();
    endNode.x = 0;
    endNode.y = 0;
    endFrame.appendChild(endNode);
    // Создаём компонент с двумя вариантами состояний
    const container = figma.createFrame();
    container.name = "Указка с вращением";
    container.resize(originalWidth * 2 + 20, originalHeight);
    container.x = originalX;
    container.y = originalY;
    container.fills = [];
    // Размещаем варианты рядом для настройки анимации
    startFrame.x = 0;
    startFrame.y = 0;
    endFrame.x = originalWidth + 20;
    endFrame.y = 0;
    container.appendChild(startFrame);
    container.appendChild(endFrame);
    // Создаём компонент вручную
    const mainComponent = figma.createComponent();
    mainComponent.name = "Указка с вращением";
    mainComponent.resize(container.width, container.height);
    mainComponent.x = container.x;
    mainComponent.y = container.y;
    // Копируем содержимое контейнера в компонент
    const startFrameCopy = startFrame.clone();
    startFrameCopy.x = 0;
    startFrameCopy.y = 0;
    mainComponent.appendChild(startFrameCopy);
    const endFrameCopy = endFrame.clone();
    endFrameCopy.x = originalWidth + 20;
    endFrameCopy.y = 0;
    mainComponent.appendChild(endFrameCopy);
    // Удаляем контейнер и добавляем компонент
    container.remove();
    parent.appendChild(mainComponent);
    node.remove();
    figma.currentPage.selection = [mainComponent];
    figma.notify("Создан компонент для анимации вращения. Настройте переход в Prototype → Smart Animate между состояниями 'Начало' и 'Конец (360°)'");
}
// Отслеживание изменения выделения
figma.on('selectionchange', () => {
    const hasSelection = figma.currentPage.selection.length > 0;
    figma.ui.postMessage({ type: 'selection-changed', hasSelection });
    // Обновляем указатель, если выбран
    if (hasSelection) {
        const selected = figma.currentPage.selection[0];
        if (selected.name === "Указка" || selected.name.includes("Указка")) {
            pointerNode = selected;
        }
    }
});
// Обработка сообщений от UI
figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
        case "add-pointer":
            // imageBytes приходит как массив чисел, конвертируем в Uint8Array
            const imageBytes = new Uint8Array(msg.imageBytes);
            await addPointerToCanvas(imageBytes);
            break;
        case "click-animation":
            playClickAnimation();
            break;
        case "set-node-size":
            try {
                const node = figma.getNodeById(msg.nodeId);
                if (node && (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "INSTANCE")) {
                    const frame = node;
                    frame.resize(msg.width, msg.height);
                    frame.x = msg.x;
                    frame.y = msg.y;
                }
            }
            catch (error) {
                console.error("Ошибка изменения размера:", error);
            }
            break;
        case "set-node-rotation":
            try {
                const node = figma.getNodeById(msg.nodeId);
                if (node && (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "INSTANCE")) {
                    const frame = node;
                    frame.rotation = msg.rotation;
                }
            }
            catch (error) {
                console.error("Ошибка изменения вращения:", error);
            }
            break;
        case "resize-ui":
            try {
                figma.ui.resize(msg.width, msg.height);
            }
            catch (error) {
                console.error("Ошибка изменения размера UI:", error);
            }
            break;
        case "cancel":
            figma.closePlugin();
            break;
    }
};
