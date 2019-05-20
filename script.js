var gameInstance = {

}

var gameMode = {
    minForLife: 2,
    maxForLife: 3
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
        newState ? this.reviveTheCell()
                 : this.killTheCell();
    }

    nextState() {
        /** Переход к следующему состоянию исходя из обстановки вокруг
         * Меняет внешний вид клетки
         * Curr_st не меняется. Меняется лишь next_st
         */
        var aliveNeighbors = this.neighborTraversal();

        if (this.curr_st && (aliveNeighbors < gameMode.minForLife || aliveNeighbors > gameMode.maxForLife)) 
            this.killTheCell();
        else if (this.curr_st == false && (aliveNeighbors >= gameMode.minForLife || aliveNeighbors <= gameMode.maxForLife)) 
            this.reviveTheCell();
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
                        if ((i || j) && field [this.box.x + i + 1] [this.box.y + j + 1]) // если это не сама клетка и эта клетка живая
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
            return this.cellArray;
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

        // TODO: Задать размеры поля в документе и размеры ячеек
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

        this.cssResize();
        gameInstance.sheet.appendChild(this.cellStyleText);

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
  
    nextFieldState() {
        for (let i = 1; i < this.h; i++)
            for (let j = 0; j < this.w; j++)
                this.cellArray[i][j].iteration();
    }
  
    applyCurrState() {
        for (let i = 1; i < this.h; i++)
            for (let j = 0; j < this.w; j++)
                this.cellArray[i][j].applyNewState();
    }

    randomState(probability) {
        /**TODO: нормировать значение probability / 100
         * при нулевой вероятности запускать clean()
        */
        if (probability == undefined) {
            probability = 0.5;
        }
        for (let i = 1; i <= this.h; i++)
            for (let j = 0; j <= this.w; j++)
                this.cellArray[i][j].setState(Math.random() <= probability);
    }
  
    startLiving() {
        this.timer = setTimeout(this.iteration, this.iterTime);
    }
  
    iteration() {
        this.iterCounter++;
        this.nextFieldState();
        this.timer = setTimeout(this.iteration, this.iterTime);
        this.applyCurrState();
    }
  
    stopLiving() {
        clearTimeout(this.timer);
    }

    cssResize() {
        var col, // количество клеток на длинной стороне
            len, // длина длинной стороны в пикселях
            docWH = this.flexbox.clientWidth / this.flexbox.clientHeight; // отношение ширины .flexbox к ее высоте в px
        if ( docWH >= this.w / this.h) {
            let cellSize = parseInt((this.flexbox.clientHeight - 2 * this.cellMargin * this.h) / this.h);
            this.cellStyleText.textContent = '.cell {width: ' + cellSize + 'px; height: ' + cellSize + 'px;}';
            this.box.style.width = toString(cellSize * this.w + 2 * this.cellMargin) + 'px';
            
        }
    }
}

//
window.onload = function() {
    var docField = document.getElementById('field');
    gameInstance.field = new Field (docField, 8, 8);
    gameInstance.sheet = document.createElement('style');
    (document.head || document.getElementsByTagName('head')[0]).appendChild(gameInstance.sheet);
}

