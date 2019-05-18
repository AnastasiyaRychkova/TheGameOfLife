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
        this.box.className = 'living-cell';
        this.next_st = true;
    }

    killTheCell() {
        this.box.className = 'dead-cell';
        this.next_st = false;
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
                    return (x + 1) / maxX;
                }
                var stepBack = function(x, maxX) {
                    return (x - 1 + maxX) / maxX;
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
    constructor (h, w) {
        this.h = h; // высота поля (в клетках)
        this.w = w; // ширина поля
        this.cellArray = []; // массив клеток
        this.iterTime = 5000; // время между итерациями
        this.iterCount = 0; // количество законченных итераций
        this.isInfinity = false; // является ли поле бесконечным
        this.flexbox = document.getElementById('field'); // поле в документе

        Cell.prototype.getField = function() {
            return cellArray;
        }

// TODO: Задать размеры поля в документе и размеры ячеек
        var i, j;
        for (i = 1; i <= h; i++) {
            for (j = 1; j <= w; j++) {
                this.cellArray[i][j] = new Cell(); // создание мертвых клеток
                this.cellArray[i][j].box = document.createElement('div');
                this.cellArray[i][j].box.className = 'dead-cell';
                this.cellArray[i][j].box.x = i - 1;
                this.cellArray[i][j].box.y = j - 1;
                this.flexbox.appendChild(cellArray[i][j].box); // добавление в документ
            }
        }

        // Создание бордюра из мертвых клеток, чтобы извавиться от проверок на границах поля
        var lastIndexH = h + 1,
            lastIndexW = w + 1;
        // Слева и справа
        for (i = 0; i <= lastIndexH; i++) {
            this.cellArray[i][0] = new Cell();
            this.cellArray[i][lastIndexW] = new Cell();
        }
        // Сверху и снизу
        for (j = 1; j <= w; j++) {
            this.cellArray[0][j] = new Cell();
            this.cellArray[lastIndexH][j] = new Cell();
        }

    }

    setInfinityOfField(newInfinity) {
        Cell.prototype.neighborTraversal = Cell.prototype.getTrav(newInfinity);
    }

    setIterTime(newIter) {
        this.iterTime = newIter;
    }
//TODO: Уметвление всего поля:)
    clean() {
        for (let i = 1; i <= )
    }
}