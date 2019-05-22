var gI = {
    sheet: null,
    state: 'loading'
}

// хранит то, что касается правил игры 
var gameMode = {
    minForLife: 2, // мин кол-во соседей для жизни
    maxForLife: 3, // макс кол-во соседей для жизни 
    hoverTime: 2000, // время наведения на клетку для переключения ее состояния

    neighborTraversal: null, // метод обхода соседей
    mouseoverEvent: null,
    mouseoutEvent: null,
    hoverEvent: null,
    hoverTimer: null
}

/** КЛЕТКА*/
class Cell {
    constructor() {
        this.curr_st = false; // жива ли клетка в данный момент
        this.next_st = false; // оживет ли клетка на следующей итерации
        this.box = document.createElement('div'); // ссылка на объект в документе
        this.box.className = 'cell dead-cell';
        this.box.onmouseover = function (e) { gameMode.mouseoverEvent(e); }
        this.box.onmouseout = function (e) { gameMode.mouseoutEvent(e); }
    }

    /**Оживить клетку на следующем этапе*/
    reviveTheCell() {
        this.box.className = 'cell living-cell';
        this.next_st = true;
    }
    /**Убить клетку на следующем этапе*/
    killTheCell() {
        this.box.className = 'cell dead-cell';
        this.next_st = false;
    }

    /**Установить состояние клетки на текущем этапе
     * Вызывается при установке рандомного состояния*/
    setState(newState) {
        if (newState) {
            this.box.className = 'cell living-cell';
            this.curr_st = true;
        } else {
            this.box.className = 'cell dead-cell';
            this.curr_st = false;
        }
    }

    /**Сменить текущее состояние клетки на противоположное
     * Используется при клике*/
    toggleState() {
        if (this.curr_st) {
            this.box.className = 'cell dead-cell';
            this.curr_st = false;
        } else {
            this.box.className = 'cell living-cell';
            this.curr_st = true;
        }
    }

    /**Установить состояние клетки на следующем этапе
     * Устанавливает согласно правилам из GameMode*/
    nextState() {
        /** Переход к следующему состоянию исходя из обстановки вокруг
         * Меняет внешний вид клетки
         * Curr_st не меняется. Меняется лишь next_st
         */
        var aliveNeighbors = gameMode.neighborTraversal(this); // количество живых соседей

        // живая клетка и [0;1] || [4;8] соседей => убить
        if (this.curr_st && (aliveNeighbors < gameMode.minForLife || aliveNeighbors > gameMode.maxForLife)) {
            this.killTheCell();
            return;
        }
        // мертвая клетка и [2;3] соседей => оживить
        if (!this.curr_st && (aliveNeighbors == gameMode.maxForLife)) {
            this.reviveTheCell();
            return;
        }
        // состояние не изменилось
        this.next_st = this.curr_st;
    }

    /** Следующее состояние делает текущим
     * Касается только внутреннего представления
     * css уже изменен */
    applyNewState() {
        this.curr_st = this.next_st;
    }
}

/** ПОЛЕ*/
class Field {
    constructor(obj, h, w) {
        this.h = h; // высота поля (в клетках)
        this.w = w; // ширина поля
        this.cellArray = new Array(h); // массив клеток
        this.iterTime = 5000; // время между итерациями
        this.iterCounter = 0; // количество законченных итераций
        this.isInfinity = false; // является ли поле бесконечным
        this.flexbox = obj; // поле в документе
        this.timer = null; // таймер для отсчета итераций
        this.cellMargin = 0.5; // если руки дойдут, то можно сделать настраиваемым параметром
        this.cellStyleText = document.createTextNode('.cell {width: 50px; height: 50px;}');

        // Возвращает ссылку на массив клеток
        Cell.prototype.getField = function () { // изменение прототипа класса пока не создан ни один объект
            return gI.field.cellArray;
        }
        this.cssResize();

        // Создание бордюра из мертвых клеток, чтобы избавиться от проверок на границах поля
        var lastIndexH = h + 1,
            lastIndexW = w + 1;
        // Слева и справа
        for (i = 0; i <= lastIndexH; i++) {
            this.cellArray[i] = new Array(w);
            this.cellArray[i][0] = new Cell();
            this.cellArray[i][lastIndexW] = new Cell();
        }
        // Сверху и снизу
        for (j = 1; j <= w; j++) {
            this.cellArray[0][j] = new Cell();
            this.cellArray[lastIndexH][j] = new Cell();
        }
        // Заполнение клетками самого поля
        var i, j;
        for (i = 1; i <= h; i++) {
            for (j = 1; j <= w; j++) {
                this.cellArray[i][j] = new Cell(); // создание мертвых клеток
                this.cellArray[i][j].box.x = i - 1; // координаты в массиве
                this.cellArray[i][j].box.y = j - 1;
                this.flexbox.appendChild(this.cellArray[i][j].box); // добавление в документ
            }
        }

        // Добавление в документ элемента <style> для изменения параметров всего класса (.cell в частности)
        var sheetArr = document.getElementsByTagName('style');
        if (sheetArr.length == 0) { // ноадо убедиться, что элемента с таким тегом еще нет
            gI.sheet = document.createElement('style'); // создать и сохранить
            (document.head || document.getElementsByTagName('head')[0]).appendChild(gI.sheet);
        } else
            gI.sheet = sheetArr[0];

        gI.sheet.appendChild(this.cellStyleText); // поместить в документ текстовый элемент со свойствами .cell

    }

    /**Установить будет ли поле иметь границы или нет */
    setInfinityOfField(newInfinity) {
        gameMode.setTrav(newInfinity);
    }

    /**Установить время между итерациями */
    setIterTime(newIter) {
        this.iterTime = newIter;
    }

    /**Отчистить все поле (умертвить все клетки) */
    clean() {
        for (let i = 1; i <= this.h; i++)
            for (let j = 1; j <= this.w; j++)
                this.cellArray[i][j].killTheCell();
    }
    /** Высчитать следующее состояние поля
     * fieldObj - ссылка на поле
     * Вызывается в функции, которая навешана на таймер, поэтому не имеет this
    */
    nextFieldState(fieldObj) {
        for (let i = 1; i <= fieldObj.h; i++)
            for (let j = 1; j <= fieldObj.w; j++)
                fieldObj.cellArray[i][j].nextState();
    }
    /**Сделать следующее состояние текущим */
    applyCurrState(fieldObj) {
        for (let i = 1; i <= fieldObj.h; i++)
            for (let j = 1; j <= fieldObj.w; j++)
                fieldObj.cellArray[i][j].applyNewState();
    }

    /**Рандомно установить состояние клеток поля */
    randomState(probability) { // probability - вероятность или плотность. можно сделать опциональным
        if (probability == undefined) {
            probability = 0.5; // значение по-умолчанию
        }
        for (let i = 1; i <= this.h; i++)
            for (let j = 1; j <= this.w; j++)
                this.cellArray[i][j].setState(Math.random() <= probability);
    }

    /** Начать игру (для поля)
     * Вызывается при смене состояния игры после нажатия на кнопку play */
    startLiving() {
        this.timer = setTimeout(this.iteration, this.iterTime, this);
    }

    /**Перевод поля в следующее состояние
     * Запуск следующей итерации
     * Применение состояния
     */
    iteration(fieldObj) {
        fieldObj.iterCounter++;
        fieldObj.nextFieldState(fieldObj);
        fieldObj.timer = setTimeout(fieldObj.iteration, fieldObj.iterTime, fieldObj);
        fieldObj.applyCurrState(fieldObj);
    }
    /** Остановить жизнь на поле (отчистить таймер) */
    stopLiving() {
        clearTimeout(this.timer);
    }

    /**Пересчитать размеры клеток и ширину поля в css
     * Вызывается при создании поля и изменении размера окна браузера
     */
    cssResize() {
        var fieldParent = this.flexbox.parentElement,
            boxW = fieldParent.clientWidth - 30, // W - 2*padding
            boxH = fieldParent.clientHeight - 30, // H - 2*padding
            docWH = boxW / boxH, // отношение ширины .flexbox к ее высоте в px
            cellSize;

        if (docWH >= (this.w / this.h)) { // поле должно растянуться в контейнере по-вертикали
            cellSize = Math.round((boxH - 2 * this.cellMargin * this.h) / this.h * 100) / 100; // линейный размер клетки
            let newWidth = this.w * (cellSize + 2 * this.cellMargin); // ширина контейнера
            this.flexbox.style.width = newWidth + 'px';
        } 
        else {  // поле должно растянуться в контейнере по-горизонтали
            cellSize = Math.round((boxW - 2 * this.cellMargin * this.w) / this.w * 100) / 100;
            let newWidth = this.w * (cellSize + 2 * this.cellMargin);
            this.flexbox.style.width = newWidth + 'px';
        }
        this.cellStyleText.textContent = '.cell {width: ' + cellSize + 'px; height: ' + cellSize + 'px;}';
    }
}



/**Установить метод обхода соседей клетки
 * Возвращает кол-во живых соседей
 * Вынесен из класса, чтобы при смене настроек, метод мог меняться у всех клеток
 */
gameMode.setTrav = function (infinity) {
    if (infinity) // Бесконечное поле
        gameMode.neighborTraversal = function (cellObj) {
            var aliveNeighbors = 0; // количество живых соседей

            var field = gI.field;

            var stepForvard = function (x, maxX) {
                return (x + 1) % maxX;
            }
            var stepBack = function (x, maxX) {
                return (x - 1 + maxX) % maxX;
            }
            // Проверить, является клетка с координатами [x,y] живой
            var checkNeighbor = function (x, y) {
                if (field.cellArray[x + 1][y + 1].curr_st)
                    aliveNeighbors++;
            }

            var left = stepBack(cellObj.box.y, field.w),    // номер столбца справа
                right = stepForvard(cellObj.box.y, field.w), // номер столбца слева
                top = stepBack(cellObj.box.x, field.h),    // номер строки сверху
                bottom = stepForvard(cellObj.box.x, field.h); // номер строки снизу

            checkNeighbor(top, left);             // [0, 0]
            checkNeighbor(top, cellObj.box.y);    // [0, 1]
            checkNeighbor(top, right);            // [0, 2]
            checkNeighbor(cellObj.box.x, left);   // [1, 0]
            checkNeighbor(cellObj.box.x, right);  // [1, 2]
            checkNeighbor(bottom, left);          // [2, 0]
            checkNeighbor(bottom, cellObj.box.y); // [2, 1]
            checkNeighbor(bottom, right);         // [2, 2]

            return aliveNeighbors;
        }
    else // Ограниченное поле
        gameMode.neighborTraversal = function (cellObj) {
            var field = cellObj.getField(), // ссылка на поле
                aliveNeighbors = 0; // количество живых соседей

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if ((i || j) && field[cellObj.box.x + i + 1][cellObj.box.y + j + 1].curr_st) // если это не сама клетка и эта клетка живая
                        aliveNeighbors++; // увеличить счетчик живых соседей
                }
            }

            return aliveNeighbors;
        }
}


/**Инициализация игры при первом запуске
 * Вызывается по событию window.onload
 */
gI.gameInit = function () {
    gameMode.setTrav(false);

    gI.playButton    = document.getElementById('playButton');
    gI.randomButton  = document.getElementById('randomButton');
    gI.killingButton = document.getElementById('killingButton');
    gI.heightInput   = document.getElementById('height');
    gI.widthInput    = document.getElementById('width');
    gI.speedRange    = document.getElementById('speedRange');
    gI.iterTime      = document.getElementById('iterTime');
    gI.checkbox      = document.getElementById('checkbox');

    gI.iterTime.innerHTML = gI.speedRange.value; // отображение значения с trackbar'а
    /** Изменение интервала между итерациями */
    gI.speedRange.oninput = function () {
        gI.field.iterTime = this.value * 1000;
        gI.iterTime.innerHTML = this.value;
    }

    /**Настройка бесконечности поля*/
    gI.checkbox.onchange = function () {
        gI.field.setInfinityOfField(gI.checkbox.checked);
    }

    /** Изменение количества клеток по высоте 
     * Ограничение: [2; 99]
    */
    gI.heightInput.onchange = function () {
        var num = Math.trunc(gI.heightInput.value); // отбрасывание дробной части
        if (num < 2)
            num = 2;
        gI.heightInput.value = num;
        
        var w = gI.field.w;
        gI.docField.innerHTML = ''; // удалить все клетки из документа
        gI.sheet.innerHTML = ''; // удалить стили клеток из документа
        gI.field = new Field(gI.docField, num, w); // создать поле нужного размера
        gI.field.setIterTime(gI.speedRange.value * 1000); // обновить тймер и характ. поля в новом объекте
        gI.field.setInfinityOfField(gI.checkbox.checked);
    }

    /**Не дает ввести дробное число */
    gI.heightInput.oninput = function () {
        if (gI.heightInput.value.length > 2)
            gI.heightInput.value = gI.heightInput.value.substr(0, 2);
    }

    /** Изменение количества клеток по ширине 
     * Ограничение: [2; 99]
    */
    gI.widthInput.onchange = function () {
        var num = Math.trunc(gI.widthInput.value);
        if (num < 2)
            num = 2;
        gI.widthInput.value = num;
        var h = gI.field.h;
        gI.docField.innerHTML = '';
        gI.field = new Field(gI.docField, h, num);
    }

    /**Не дает ввести дробное число */
    gI.widthInput.oninput = function () {
        if (gI.widthInput.value.length > 2)
            gI.widthInput.value = gI.widthInput.value.substr(0, 2);
    }

    /**Событие, которое должно произойти при долгом наведении
     * Переключение состояния у клетки
     */
    gameMode.hoverEvent = function (e) {
        if (e.target.hasAttribute('hoverEvent')) {
            gI.field.cellArray[e.target.x + 1][e.target.y + 1].toggleState();
            e.target.removeAttribute('hoverEvent');
        }
    }

    /**Событие при наведении на клетку
     * Отметить и запустить таймер
     */
    gameMode.mouseoverEvent = function (e) {
        e.target.setAttribute('hoverEvent', '');
        gameMode.hoverTimer = setTimeout(gameMode.hoverEvent, gameMode.hoverTime, e);
    }

    /**Событие при отведении мыши с клетки
     * Удалить отметку и таймер
     */
    gameMode.mouseoutEvent = function (e) {
        e.target.removeAttribute('hoverEvent', '');
        clearTimeout(gameMode.hoverTimer);
    }


    gI.playButton.addEventListener('click', playBtnClick);
    gI.docField.addEventListener('click', fieldClickEvent);

    gI.activateButtons();
}

/**Сделать кнопки randomButton и killingButton активными
 */
gI.activateButtons = function () {
    gI.randomButton.addEventListener('click', activateRandomBtn);
    gI.killingButton.addEventListener('click', activateKillingBtn);
}

/** Деактивировать кнопки randomButton и killingButton*/
gI.deactivateButtons = function () {
    gI.randomButton.removeEventListener('click', activateRandomBtn);
    gI.killingButton.removeEventListener('click', activateKillingBtn);
}

/**Установить состояние игры 'play'
 * Кликать по полю больше нельзя
*/
gI.setStartState = function () {
    if (gI.state == 'play')
        return;
    gI.state = 'play';
    gI.playButton.style.backgroundImage = "url('img/icons8-pause.png')"; // поменять картинку на кнопке
    gI.field.iterCounter = 0;
    gI.field.startLiving();
    gI.deactivateButtons();
    gI.docField.removeEventListener('click', fieldClickEvent);
    gI.heightInput.readOnly = true;
    gI.widthInput.readOnly = true;
}

/**Установить сосотояние игры 'stop' */
gI.setStopState = function () {
    if (gI.state == 'stop')
        return;
    gI.state = 'stop';
    gI.playButton.style.backgroundImage = "url('img/icons8-start.png')";
    gI.field.stopLiving();
    gI.activateButtons();
    gI.docField.addEventListener('click', fieldClickEvent);
    gI.heightInput.readOnly = false;
    gI.widthInput.readOnly = false;
    console.log(gI.field.iterCounter + ' iterations');
}

/**Отлавливает событие клика по клетке*/
function fieldClickEvent(e) {
    if (e.target.className == 'field-box') // мимо
        return;
    gI.field.cellArray[e.target.x + 1][e.target.y + 1].toggleState();
}

function playBtnClick() {
    if (gI.state == 'play')
        gI.setStopState();
    else
        gI.setStartState();
}

function activateRandomBtn() {
    gI.field.randomState();
}

function activateKillingBtn() {
    gI.field.clean();
}

function windowResizeEvent() {
    gI.field.cssResize();
}

//
window.onload = function () {
    gI.docField = document.getElementById('field');
    gI.field = new Field(gI.docField, 8, 8);

    window.addEventListener('resize', windowResizeEvent);
    gI.gameInit();
}

