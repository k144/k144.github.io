let prefixElm = document.getElementById("prefix");
let infixElm = document.getElementById("infix");
let postfixElm = document.getElementById("postfix");
prefixElm.addEventListener("input", prefix);
infixElm.addEventListener("input", infix);
postfixElm.addEventListener("input", postfix);
let resultElm = document.getElementById("wynik");
let pl = document.documentElement.lang == "pl";

const Types = {OPERATOR: 0, NUMBER: 1, WHITESPACE: 2, BRACKET: 3};


function getCharType(c) {
    if (c == " ") {
        return Types.WHITESPACE;
    } else if (c == '(' || c == ')') {
        return Types.BRACKET;
    } else if (c >= '0' && c <= '9' || c == '.' || c == ',') {
        return Types.NUMBER;
    } else if ("+-*/^".includes(c)) {
        return Types.OPERATOR;
    } else {
        console.log("Błąd - zły znak", c);
    }
}

let opCallback = new Map([ 
    ['+', (a, b) => a + b],
    ['-', (a, b) => a - b],
    ['*', (a, b) => a * b],
    ['/', (a, b) => a / b],
    ['^', (a, b) => Math.pow(a, b)],
 ]);


function strToNumber(str) {
    if (pl) {
        let parsable = "";
        let arr = str.split('');
        for (c of arr) {
            switch (c) {
            case '.':
                continue;
            case ',':
                c = '.';
                break;
            }
            parsable += c;
        }
        return parseFloat(parsable);
    }
    return parseFloat(str);


}

function stackToStr(stack) {
    result = stack.map((el) => el[0]).join(" ");
    if (pl) {
        result = result.replace('.', ',');
    }
    return result;
}

function clearAll() {
    prefixElm.value = "";
    infixElm.value = "";
    postfixElm.value = "";
    resultElm.innerText = "";
}

function tokenize(str) {
    result = [];
    let buf = "";
    let lastType = undefined;
    let type = undefined;
    function push(str) {
        if (str.length > 0) {
            if (lastType == Types.NUMBER) {
                result.push([strToNumber(str), lastType])
            } else {
                result.push([str, lastType]);
            }
        }
    }
    for (let c of str.split("")) {
        type = getCharType(c);
        if (type != lastType) {
            if (lastType == undefined && type != Types.WHITESPACE) {
                buf = c;
                lastType = type;
                continue;
            }
            push(buf);

            switch (type) {
            case Types.OPERATOR:
                buf = c;
                lastType = type;
                continue;
            case Types.NUMBER:
                buf = c;
                break;
            case Types.WHITESPACE:
                buf = "";
                lastType = type;
                continue;
            case Types.BRACKET:
                buf = c;
                lastType = type;
                continue;
            default:
                buf = "";
                continue;
            }
        } else {
            switch (type) {
            case Types.OPERATOR:
                lastType = type;
                push(buf);
                buf = c;
                continue;
            case Types.NUMBER:
                buf += c;
                break;
            case Types.WHITESPACE:
                continue;
            case Types.BRACKET:
                break;
            default:
                buf = "";
                continue;
            }

        }
        lastType = type;
    }
    push(buf);
    return result;
}

function precedence(c) {
    switch (c) {
        case '^':
            return 3;
        case '*':
        case '/':
            return 2;
        case '+':
        case '-':
            return 1;
        default:
            return -1;
    }
}
let priority = new Map([ 
    ['(', 0],
    ['+', 1],
    ['-', 1],
    ['*', 2],
    ['/', 2],
    ['^', 3],
 ])
function infix() {
    if (infixElm.value == 0) {
        clearAll();
        return;
    }
    let s = infixElm.value.replaceAll(' ', '')
    let tokenized = tokenize(s);
    let stack = [];
    let tokenizedPost = [];
    let len = tokenized.length;
    let tempTokenized = [tokenized[0]];

    for (let i = 1; i<len; i++) {
        if (tokenized[i-1][0] == ")" && tokenized[i][1] == Types.NUMBER) {
            tempTokenized.push(["*", Types.OPERATOR]);
        } else if (tokenized[i-1][1] == Types.NUMBER && tokenized[i][0] == "(") {
            tempTokenized.push(["*", Types.OPERATOR]);
        }
        tempTokenized.push(tokenized[i]);
    }

    tokenized = [...tempTokenized];
    for (let it of tokenized) {
        let val = it[0]
        let top = stack[stack.length - 1];
        if (it[1] == Types.NUMBER) {
            tokenizedPost.push(it);
        } else if (val == '(') {
            stack.push(it);
        } else if (val == ')') {
            while (stack.length > 0 && top[0] != '(') {
                tokenizedPost.push(stack.pop());
                top = stack[stack.length - 1];
            }
            if (top[0] == '(') {
                stack.pop();
            }
        } else {
            while (stack.length > 0 && precedence(val) <= precedence(top[0])) {
                tokenizedPost.push(stack.pop());
                top = stack[stack.length - 1];
            }
            stack.push(it);
        }
    }

    while (stack.length > 0) {
        let elm = stack.pop();
        if (elm[1] == Types.BRACKET) {
            continue;
        }
        tokenizedPost.push(elm);
    }

    resultElm.innerText = "= " + calculatePostfix(tokenizedPost);
    postfixElm.value = stackToStr(tokenizedPost);
    prefixElm.value = stackToStr(tokenizedPost.reverse());
}

function prefix() {
    if (prefixElm.value == 0) {
        clearAll();
        return;
    }
    let tokenizedPost = tokenize(prefixElm.value).reverse();
    resultElm.innerText = "= " + calculatePostfix(tokenizedPost);
    postfixElm.value = stackToStr(tokenizedPost);
}

function postfix() {
    if (postfixElm.value == 0) {
        clearAll();
        return;
    }
    let tokenizedPost = tokenize(postfixElm.value);
    resultElm.innerText = "= " + calculatePostfix(tokenizedPost);
    calculatePostfix(tokenizedPost);
    prefixElm.value = stackToStr(tokenizedPost.reverse());
}

function calculatePostfix(expr) {
    let stack = []
    for (let it of expr) {
        switch(it[1]) {
        case Types.NUMBER:
            stack.push(it);
            break;
        case Types.OPERATOR:
            let b = stack.pop()[0];
            let a = stack.pop()[0];
            stack.push([opCallback.get(it[0])(a,b), Types.NUMBER]);
        }

    }
    if (pl) {
        return stack[0][0].toString().replace('.', ',');
    } else {
        return stack[0][0];
    }
}

infix();