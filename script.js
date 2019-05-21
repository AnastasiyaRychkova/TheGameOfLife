var gI = {
    sheet: null,
    state: 'loading'
}

var gameMode = {
    minForLife: 2,
    maxForLife: 3,
    hoverTime: 2000
}

/** КЛЕТКА*/
class Cell {
    constructor() {
        this.curr_st = false; // жива ли клетка в данный момент
        this.next_st = false; // оживет ли клетка на следующей итерации
        this.box = null; // ссылка на объект в документе
        this.neighborTraversal = this.getTrav(false);
    }

    reviveTheCell() {
        this.box.className = 'cell living-cell';
        this.next_st = true;
    }

    killTheCell() {
        this.box.className = 'cell dead-cell';
        this.next_st = false;
    }

    setState (newState) {
        if (newState) {
            this.box.className = 'cell living-cell';
            this.curr_st = true;
        } else {
            this.box.className = 'cell dead-cell';
            this.curr_st = false;
        }
    }
  
  	toggleState() {
     	if (this.curr_st) {
            this.box.className = 'cell dead-cell';
            this.curr_st = false;
        } else {
            this.box.className = 'cell living-cell';
            this.curr_st = true;
        }
    } 

    nextState() {
        /** Переход к следующему состоянию исходя из обстановки вокруг
         * Меняет внешний вид клетки
         * Curr_st не меняется. Меняется лишь next_st
         */
        var aliveNeighbors = this.neighborTraversal();

        if (this.curr_st && (aliveNeighbors < gameMode.minForLife || aliveNeighbors > gameMode.maxForLife)) {
            this.killTheCell();
            return;
        }
        if (!this.curr_st && (aliveNeighbors == gameMode.maxForLife)) {
            this.reviveTheCell();
            return;
        }
        this.next_st = this.curr_st;
    }

    applyNewState() {
        this.curr_st = this.next_st;
    }

    /**Возвращает метод обхода соседей и подсчета живых среди них.
     * infinity - если true, то поле представляет собой тор, т.е. границы поля как бы сшиты
     */
    getTrav(infinity) { 
        if (infinity) // Бесконечное поле
            return function() {
                var aliveNeighbors = 0; // количество живых соседей

                var field = this.getField(); 

                var stepForvard = function(x, maxX) {
                    return parseInt((x + 1) / maxX);
                }
                var stepBack = function(x, maxX) {
                    return parseInt((x - 1 + maxX) / maxX);
                }
                // Проверить, является клетка с координатами [x,y] живой
                var checkNeighbor = function(x, y) {
                    if (field[x + 1][y + 1].curr_st)
                        aliveNeighbors++;
                }

                var right  = stepBack(this.box.y, field.w),    // номер столбца справа
                    left   = stepForvard(this.box.y, field.w), // номер столбца слева
                    top    = stepBack(this.box.x, field.h),    // номер строки сверху
                    bottom = stepForvard(this.box.x, field.h); // номер строки снизу

                checkNeighbor(top, left);           // [0, 0]
                checkNeighbor(top, this.box.y);     // [0, 1]
                checkNeighbor(top, right);          // [0, 2]
                checkNeighbor(this.box.x, left);    // [1, 0]
                checkNeighbor(this.box.x, right);   // [1, 2]
                checkNeighbor(bottom, left);        // [2, 0]
                checkNeighbor(bottom, this.box.y);  // [2, 1]
                checkNeighbor(bottom, right);       // [2, 2]

                return aliveNeighbors;
            }
        else // Ограниченное поле
            return function() {
                var field = this.getField(), // ссылка на поле
                    aliveNeighbors = 0; // количество живых соседей

                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if ((i || j) && field [this.box.x + i + 1] [this.box.y + j + 1].curr_st) // если это не сама клетка и эта клетка живая
                            aliveNeighbors++; // увеличить счетчить живых соседей
                    }
                }

                return aliveNeighbors;
            }
    }
}

/** ПОЛЕ*/ 
class Field { 
    constructor (obj, h, w) {
        this.h = h; // высота поля (в клетках)
        this.w = w; // ширина поля
        this.cellArray = new Array(h); // массив клеток
        this.iterTime = 5000; // время между итерациями
        this.iterCounter = 0; // количество законченных итераций
        this.isInfinity = false; // является ли поле бесконечным
        this.flexbox = obj; // поле в документе
        this.timer = null;
        this.cellMargin = 0.5;
        this.cellStyleText = document.createTextNode('.cell {width: 50px; height: 50px;}');

        Cell.prototype.getField = function() {
            return gI.field.cellArray;
        }

        // Создание бордюра из мертвых клеток, чтобы извавиться от проверок на границах поля
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

        var i, j;
        for (i = 1; i <= h; i++) {
            for (j = 1; j <= w; j++) {
                this.cellArray[i][j] = new Cell(); // создание мертвых клеток
                this.cellArray[i][j].box = document.createElement('div');
                this.cellArray[i][j].box.className = 'cell dead-cell';
                this.cellArray[i][j].box.x = i - 1;
                this.cellArray[i][j].box.y = j - 1;
                this.flexbox.appendChild(this.cellArray[i][j].box); // добавление в документ
            }
        }
      
        var sheetArr = document.getElementsByTagName('style'); 
        if (sheetArr.length == 0) {
            gI.sheet = document.createElement('style'); 
            (document.head || document.getElementsByTagName('head')[0]).appendChild (gI.sheet);
        } else
            gI.sheet = sheetArr[0];

        this.cssResize();
        gI.sheet.appendChild(this.cellStyleText);

    }

    setInfinityOfField(newInfinity) {
        Cell.prototype.neighborTraversal = Cell.prototype.getTrav(newInfinity);
    }

    setIterTime(newIter) {
        this.iterTime = newIter;
    }
  
  
    clean() {
        for (let i = 1; i <= this.h; i++)
            for (let j = 1; j <= this.w; j++)
                this.cellArray[i][j].killTheCell();
    }
  
    nextFieldState(fieldObj) {
        for (let i = 1; i <= fieldObj.h; i++)
            for (let j = 1; j <= fieldObj.w; j++)
                fieldObj.cellArray[i][j].nextState();
    }
  
    applyCurrState(fieldObj) {
        for (let i = 1; i <= fieldObj.h; i++)
            for (let j = 1; j <= fieldObj.w; j++)
                fieldObj.cellArray[i][j].applyNewState();
    }

    randomState(probability) {
        /**TODO: нормировать значение probability / 100
         * при нулевой вероятности запускать clean()
        */
        if (probability == undefined) {
            probability = 0.5;
        }
        for (let i = 1; i <= this.h; i++)
            for (let j = 1; j <= this.w; j++)
                this.cellArray[i][j].setState(Math.random() <= probability);
    }
  
    startLiving() {
        this.timer = setTimeout(this.iteration, this.iterTime, this);
    }
  
    iteration(fieldObj) {
        fieldObj.iterCounter++;
        fieldObj.nextFieldState(fieldObj);
        fieldObj.timer = setTimeout(fieldObj.iteration, fieldObj.iterTime, fieldObj);
        fieldObj.applyCurrState(fieldObj);
    }
  
    stopLiving() {
        clearTimeout(this.timer);
    }

    cssResize() {
        var fieldParent = this.flexbox.parentElement,
            docWH = fieldParent.clientWidth / fieldParent.clientHeight, // отношение ширины .flexbox к ее высоте в px
            cellSize;
        //FIXME: странно работает перестройка относительно высоты
        if ( docWH >= (this.w / this.h)) {
            cellSize = parseInt((fieldParent.clientHeight - 2 * this.cellMargin * this.h) / this.h);
            let newWidth = cellSize * (this.w + 2 * this.cellMargin);
            console.log(fieldParent.clientWidth, fieldParent.clientHeight, newWidth, cellSize);
            this.flexbox.style.width = newWidth + 'px';
        } else { 
            this.flexbox.style.width = '100%';
            cellSize = parseInt((this.flexbox.clientWidth - 2 * this.cellMargin * this.w) / this.w);
        }
        this.cellStyleText.textContent = '.cell {width: ' + cellSize + 'px; height: ' + cellSize + 'px;}';
    }
}

gI.gameInit = function() {
    gI.playButton    = document.getElementById('playButton');
    gI.randomButton  = document.getElementById('randomButton');
    gI.killingButton = document.getElementById('killingButton');
    gI.heightInput   = document.getElementById('height');
    gI.widthInput    = document.getElementById('width');
    gI.speedRange    = document.getElementById('speedRange');
    gI.iterTime      = document.getElementById('iterTime');
    gI.checkbox      = document.getElementById('checkbox');

    gI.iterTime.innerHTML = speedRange.value;
    speedRange.oninput = function() {
        gI.field.iterTime = this.value * 1000;
        gI.iterTime.innerHTML = this.value;
    }

    gI.checkbox.onchange = function() {
        gI.field.setInfinityOfField(gI.checkbox.checked);
        console.log('checked');
    }

    gI.heightInput.onchange = function() {
        var num = Math.trunc(gI.heightInput.value);
        if (num < 2) 
            num = 2;
        gI.heightInput.value = num;
        var w = gI.field.w;
        gI.docField.innerHTML = '';
        gI.field = new Field(gI.docField, num, w);
    }

    gI.heightInput.oninput = function () {
        if (gI.heightInput.value.length > 2) 
            gI.heightInput.value = gI.heightInput.value.substr(0, 2);
    }

    gI.widthInput.onchange = function() {
        var num = Math.trunc(gI.widthInput.value);
        if (num < 2) 
            num = 2;
        gI.widthInput.value = num;
        var h = gI.field.h;
        gI.docField.innerHTML = '';
        gI.field = new Field(gI.docField, h, num);
    }

    gI.widthInput.oninput = function () {
        if (gI.widthInput.value.length > 2) 
            gI.widthInput.value = gI.widthInput.value.substr(0, 2);
    }

    gI.playButton.addEventListener('click', playBtnClick);
    gI.docField.addEventListener('click', fieldClickEvent);

    gI.activateButtons();
}

gI.activateButtons = function() {
    gI.randomButton.addEventListener('click', activateRandomBtn);
    gI.killingButton.addEventListener('click', activateKillingBtn);
}

gI.deactivateButtons = function() {
    gI.randomButton.removeEventListener('click', activateRandomBtn);
    gI.killingButton.removeEventListener('click', activateKillingBtn);
}

gI.setStartState = function() {
    if (gI.state == 'play') 
        return;
    gI.state = 'play';
    gI.playButton.style.backgroundImage = "url('img/icons8-pause.png')";
    gI.field.startLiving();
    gI.deactivateButtons();
    gI.docField.removeEventListener('click', fieldClickEvent);
}

gI.setStopState = function() {
    if (gI.state == 'stop') 
        return;
    gI.state = 'stop';
    gI.playButton.style.backgroundImage = "url('img/icons8-start.png')";
    gI.field.stopLiving();
    gI.activateButtons();
    gI.docField.addEventListener('click', fieldClickEvent);
}

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
window.onload = function() {
    gI.docField = document.getElementById('field');
    gI.field = new Field (gI.docField, 8, 8);

    window.addEventListener('resize', windowResizeEvent);
    gI.gameInit();
}

