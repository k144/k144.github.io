let prefixElm = document.getElementById("prefix");
let infixElm = document.getElementById("infix");
let postfixElm = document.getElementById("postfix");
prefixElm.addEventListener("input", prefix);
infixElm.addEventListener("input", infix);
postfixElm.addEventListener("input", postfix);
let resultElm = document.getElementById("wynik");
let pl = document.documentElement.lang == "pl";

const Types = {OPERATOR: 0, OPERAND: 1, WHITESPACE: 2, BRACKET: 3};


function getCharType(c) {
    if (c == " ") {
        return Types.WHITESPACE;
    } else if (c == '(' || c == ')') {
        return Types.BRACKET;
    } else if ("+-*/^".includes(c)) {
        return Types.OPERATOR;
    } else {
        return Types.OPERAND;
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

function stackToStr(stack, spaces=true) {
    if (spaces) {
        result = stack.map((el) => el[0]).join(" ");
    } else {
        result = stack.map((el) => el[0]).join("");
    }
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
            if (lastType == Types.OPERAND) {
                let num = strToNumber(str);
                if (String(num) == str) {
                    result.push([num, lastType]);
                } else {
                    result.push([str, lastType]);
                }
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
            case Types.OPERAND:
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
            case Types.OPERAND:
                buf += c;
                break;
            case Types.WHITESPACE:
                continue;
            case Types.BRACKET:
                push(buf);
                buf = c;
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
        if (
            (tokenized[i-1][0] == ")" && tokenized[i][1] == Types.OPERAND) ||
            (tokenized[i-1][1] == Types.OPERAND && tokenized[i][0] == "(") ||
            (tokenized[i-1][0] == ")" && tokenized[i][0] == "(")
           ) {
            tempTokenized.push(["*", Types.OPERATOR]);
        }
        tempTokenized.push(tokenized[i]);
    }

    tokenized = [...tempTokenized];
    for (let it of tokenized) {
        let val = it[0]
        let top = stack[stack.length - 1];
        if (it[1] == Types.OPERAND) {
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

    solvePostfix(tokenizedPost);
    postfixElm.value = stackToStr(tokenizedPost);
    prefixElm.value = stackToStr(tokenizedPost.reverse());
}

function prefix() {
    if (prefixElm.value == 0) {
        clearAll();
        return;
    }
    let tokenizedPost = tokenize(prefixElm.value).reverse();
    solvePostfix(tokenizedPost);
    postfixElm.value = stackToStr(tokenizedPost);
    infixElm.value = stackToStr(PostToIn(tokenizedPost), false);
}

function postfix() {
    if (postfixElm.value == 0) {
        clearAll();
        return;
    }
    let tokenizedPost = tokenize(postfixElm.value);
    solvePostfix(tokenizedPost);
    infixElm.value = stackToStr(PostToIn(tokenizedPost), false);
    let tokenizedPre = tokenizedPost.reverse();
    prefixElm.value = stackToStr(tokenizedPre);
}

function solvePostfix(expr) {
    let stack = []
    for (let it of expr) {
        switch(it[1]) {
        case Types.OPERAND:
            if (isNaN(it[0])) {
                resultElm.innerText = "";
                return;
            }
            stack.push(it);
            break;
        case Types.OPERATOR:
            let b = stack.pop()[0];
            let a = stack.pop()[0];
            stack.push([opCallback.get(it[0])(a,b), Types.OPERAND]);
        }

    }
    let result;
    if (pl) {
        result = stack[0][0].toString().replace('.', ',');
    } else {
        result = stack[0][0];
    }

    resultElm.innerText = "= " + result;

}


function PostToIn(expr) {
    let len = expr.length;
    let stack = [];
    for (let i=0; i<len; i++) {
        let it = expr[i];
        if (it[1] == Types.OPERAND) {
            stack.push({val: it});
        } else {
            let b = stack.pop();
            let a = stack.pop();
            stack.push({val: it, nodeA: a, nodeB: b});
        }

    }
    let tree = stack[0];
    let result = [];
    function unwind(node, parentPrec) {
        let prec = precedence(node.val[0]);
        let brackets = parentPrec > prec ? true : false;
        if (node.val[1] == Types.OPERATOR) {
            if (brackets) {
                result.push(["(", Types.BRACKET]);
            }
            unwind(node.nodeA, prec);
            result.push(node.val);
            unwind(node.nodeB, prec);
            if (brackets) {
                result.push([")", Types.BRACKET]);
            }
        } else {
            result.push(node.val);
        }

    }
    unwind(tree);
    return result;

}

infix();