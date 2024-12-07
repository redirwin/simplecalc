/**
 * Calculator state management and operations
 */class Calculator {
    constructor() {
        this.currentInput = "";
        this.previousInput = "";
        this.operation = null;
        this.isResultDisplayed = false;
        this.lastNumber = null;
        this.lastOperation = null;
        this.operationString = "";

        this.display = document.getElementById("display");
        this.operatorDisplay = document.getElementById("operator-display");
        this.MAX_DIGITS = 15;
        this.calculatorDisplay = document.querySelector(".calculator-display");

        // Add new state for expression building
        this.expression = [];  // Array to store full expression tokens
        this.parenthesesCount = 0;

        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for calculator buttons
     */
    initializeEventListeners() {
        document.querySelectorAll(".calculator-button").forEach(button => {
            button.addEventListener("click", (e) => {
                const number = button.dataset.number;
                const operation = button.dataset.operation;
                const action = button.dataset.action;

                if (number) {
                    this.appendNumber(number);
                } else if (operation) {
                    this.setOperation(operation);
                } else if (action) {
                    this.handleAction(action);
                }
            });
        });

        // Add keyboard support
        document.addEventListener("keydown", (e) => this.handleKeyboardInput(e));
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardInput(e) {
        if (e.key >= "0" && e.key <= "9") {
            this.appendNumber(e.key);
        } else if (e.key === ".") {
            this.appendDecimal();
        } else if (["+", "-", "*", "/"].includes(e.key)) {
            this.setOperation(e.key);
        } else if (e.key === "Enter" || e.key === "=") {
            this.calculate();
        } else if (e.key === "Escape") {
            this.clear();
        } else if (e.key === "Backspace" || e.key === "Delete") {
            this.handleDelete();
        }
    }

    /**
     * Handle special calculator actions
     * @param {string} action - The action to perform
     */
    handleAction(action) {
        switch (action) {
            case "delete":
                this.handleDelete();
                break;
            case "sqrt":
                this.calculateSquareRoot();
                break;
            case "square":
                this.calculateSquare();
                break;
            case "clear":
                this.clear();
                break;
            case "decimal":
                this.appendDecimal();
                break;
            case "calculate":
                this.calculate();
                break;
            case "toggleSign":
                this.toggleSign();
                break;
            case "leftParen":
                this.handleLeftParen();
                break;
            case "rightParen":
                this.handleRightParen();
                break;
        }
    }

    /**
     * Append a number to the current input
     * @param {string} number - The number to append
     */
    appendNumber(number) {
        if (this.isResultDisplayed) {
            this.clear();
        }

        // Check for implicit multiplication after closing parenthesis
        if (this.expression.length > 0 && 
            this.expression[this.expression.length - 1] === ')') {
            
            if (this.currentInput) {
                this.expression.push(this.currentInput);
            }
            this.expression.push('*');
            this.currentInput = number;
        } else {
            // Handle digit limits
            if (this.currentInput.length >= this.MAX_DIGITS) {
                this.showLimitExceededFeedback();
                return;
            }

            // Update currentInput
            if (this.currentInput === "0" && number !== ".") {
                this.currentInput = number;
            } else {
                this.currentInput += number;
            }
        }

        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Append decimal point to current input
     */
    appendDecimal() {
        if (this.isResultDisplayed) {
            this.currentInput = "0";
            this.isResultDisplayed = false;
        }

        // If empty, start with "0."
        if (this.currentInput === "") {
            this.currentInput = "0";
        }

        // Only add decimal if one doesn't exist
        if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
            this.updateDisplay();
        }
    }

    /**
     * Set the current operation
     * @param {string} op - The operation to set
     */
    setOperation(op) {
        // Special case: handle minus sign as negative number indicator only when:
        // 1. It's the first input, or
        // 2. It follows another operator
        const lastToken = this.expression[this.expression.length - 1];
        const isFirstInput = this.expression.length === 0 && this.currentInput === "";
        const followsOperator = ['+', '-', '*', '/'].includes(lastToken);
        
        if (op === "-" && (isFirstInput || followsOperator)) {
            this.currentInput = "-";
            this.buildOperationString();
            this.updateDisplay();
            return;
        }

        // Handle as regular operation
        if (this.currentInput === "" && this.expression.length === 0) return;

        if (this.isResultDisplayed) {
            this.expression = [this.currentInput];
            this.currentInput = "";
            this.isResultDisplayed = false;
        } else if (this.currentInput) {
            this.expression.push(this.currentInput);
            this.currentInput = "";
        }

        // Update operator
        if (['+', '-', '*', '/'].includes(lastToken)) {
            this.expression[this.expression.length - 1] = op;
        } else {
            this.expression.push(op);
        }
        
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Update the operator display
     * @param {string} op - The operation to display
     */
    updateOperatorDisplay(op) {
        if (this.isResultDisplayed) {
            this.operatorDisplay.textContent = `${this.operationString} =`;
        } else if (this.operation) {
            // Show the full operation string in the operator display
            this.operatorDisplay.textContent = this.operationString;
        } else {
            this.operatorDisplay.textContent = "";
        }
    }

    /**
     * Rounds a number to avoid floating-point precision errors
     * @param {number} value - The number to round
     * @returns {number} - The rounded number
     */
    roundResult(value) {
        const num = Number(value);
        if (isNaN(num)) return value;

        // Handle decimal precision
        const absNum = Math.abs(num);
        if (absNum < 1) {
            return Number(num.toPrecision(12));
        }

        const decimalStr = num.toString();
        if (decimalStr.includes('.')) {
            const [integer, decimal] = decimalStr.split('.');
            if (decimal.length > 12) {
                return Number(num.toFixed(12));
            }
        }

        return num;
    }

    /**
     * Performs the calculation respecting parentheses and order of operations
     */
    calculate() {
        if (this.currentInput) {
            this.expression.push(this.currentInput);
        }

        const fullExpression = this.operationString;
        
        try {
            // First evaluate parentheses
            let result = this.evaluateParentheses(fullExpression);
            
            // Format and store result
            this.currentInput = this.formatCalculationResult(result);
            this.operationString = fullExpression;
            this.isResultDisplayed = true;
            this.expression = [];
            this.updateDisplay();
        } catch (error) {
            console.error('Calculation error:', error);
            this.currentInput = "Error";
            // Keep the original expression in the operator display
            this.operatorDisplay.textContent = `${fullExpression} =`;
            this.isResultDisplayed = true;
            this.updateDisplay();
        }
    }

    /**
     * Evaluates expressions within parentheses
     * @param {string} expression - The expression to evaluate
     * @returns {string} - Expression with parentheses evaluated
     */
    evaluateParentheses(expression) {
        while (expression.includes('(')) {
            // Find the innermost parentheses
            const lastOpen = expression.lastIndexOf('(');
            const nextClose = expression.indexOf(')', lastOpen);
            
            if (nextClose === -1) {
                throw new Error("Mismatched parentheses");
            }
            
            // Extract and evaluate the expression within parentheses
            const innerExpr = expression.substring(lastOpen + 1, nextClose);
            // Treat empty parentheses as zero
            const innerResult = innerExpr.trim() ? 
                this.evaluateExpression(innerExpr) : 
                0;
            
            // Check for implicit multiplication after the closing parenthesis
            const afterClose = nextClose + 1;
            const followingChar = expression.charAt(afterClose);
            const needsMultiplication = /[0-9]/.test(followingChar);
            
            // Replace the parenthetical expression with its result
            expression = expression.substring(0, lastOpen) + 
                        innerResult + 
                        (needsMultiplication ? ' * ' : '') +
                        expression.substring(afterClose);
        }
        return this.evaluateExpression(expression);
    }

    /**
     * Evaluates a simple expression without parentheses
     * @param {string} expression - The expression to evaluate
     * @returns {number} - The result of the evaluation
     */
    evaluateExpression(expression) {
        // Handle potential lack of spaces around operators
        expression = expression.replace(/([+\-*/])/g, ' $1 ');
        
        // Parse the expression into tokens
        const tokens = expression.split(' ').filter(token => token !== '');

        // Handle negative numbers before tokenizing operations
        const processedTokens = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            // If it's a minus sign followed by a number and either:
            // 1. It's the first token, or
            // 2. The previous token was an operator
            if (token === '-' && 
                i + 1 < tokens.length && 
                !isNaN(tokens[i + 1]) && 
                (i === 0 || ['+', '-', '*', '/'].includes(tokens[i - 1]))) {
                processedTokens.push((-parseFloat(tokens[i + 1])).toString());
                i++; // Skip the next token since we've processed it
            } else {
                processedTokens.push(token);
            }
        }

        // First pass: handle multiplication and division
        for (let i = 1; i < processedTokens.length - 1; i += 2) {
            if (processedTokens[i] === '*' || processedTokens[i] === '/') {
                const left = parseFloat(processedTokens[i - 1]);
                const right = parseFloat(processedTokens[i + 1]);
                let result;
                
                if (processedTokens[i] === '*') {
                    result = left * right;
                } else if (processedTokens[i] === '/' && right !== 0) {
                    result = left / right;
                } else {
                    throw new Error("Division by zero");
                }
                
                processedTokens.splice(i - 1, 3, result.toString());
                i -= 2;
            }
        }

        // Second pass: handle addition and subtraction
        let result = parseFloat(processedTokens[0]);
        for (let i = 1; i < processedTokens.length - 1; i += 2) {
            const right = parseFloat(processedTokens[i + 1]);
            if (processedTokens[i] === '+') {
                result += right;
            } else if (processedTokens[i] === '-') {
                result -= right;
            }
        }

        return result;
    }

    /**
     * Formats calculation result to prevent floating point issues
     * @param {number} result - The calculation result to format
     * @returns {string} Formatted result
     */
    formatCalculationResult(result) {
        if (Math.abs(result) >= 1e12) {
            return result.toExponential(6);
        }

        // Convert to string with fixed decimal places to avoid floating point issues
        const resultString = result.toFixed(12);
        // Remove trailing zeros after decimal point
        return parseFloat(resultString).toString();
    }

    /**
     * Repeats the last operation with the last number
     */
    repeatOperation() {
        if (this.lastNumber === null || this.operation === null) return;

        const current = parseFloat(this.currentInput || this.previousInput);
        this.previousInput = current.toString();
        this.currentInput = "";
        this.calculate();
    }

    /**
     * Calculate square root of current input
     */
    calculateSquareRoot() {
        if (this.currentInput === "") return;
        
        const value = parseFloat(this.currentInput);
        this.operationString = `√(${this.currentInput})`;
        
        if (value < 0) {
            this.currentInput = "Error";
        } else {
            this.currentInput = Math.sqrt(value).toString();
        }
        
        this.isResultDisplayed = true;
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }

    /**
     * Calculate square of current input
     */
    calculateSquare() {
        if (this.currentInput === "") return;
        this.operationString = `(${this.currentInput})²`;
        this.currentInput = Math.pow(parseFloat(this.currentInput), 2).toString();
        this.isResultDisplayed = true;
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }

    /**
     * Clear the calculator display
     */
    clearDisplay() {
        this.currentInput = "";
        this.previousInput = "";
        this.operation = null;
        this.lastNumber = null;
        this.lastOperation = null;
        this.isResultDisplayed = false;
        this.operationString = "";  // Clear the operation string
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }

    /**
     * Updates the display with current operation or result
     */
    updateDisplay() {
        if (this.isResultDisplayed) {
            this.display.value = this.formatNumber(this.currentInput);
            this.operatorDisplay.textContent = `${this.operationString} =`;
        } else {
            // Always show the operation string if it exists
            if (this.operationString) {
                this.display.value = this.operationString;
            } else {
                this.display.value = this.formatNumber(this.currentInput || "0");
            }
            this.operatorDisplay.textContent = "";
        }
    }

    /**
     * Format number for display
     * @param {string} num - The number to format
     * @returns {string} The formatted number
     */
    formatNumber(num) {
        if (!num) return "0";
        if (num === "Error") return "Error";

        if (num.includes('e')) {
            return num;
        }

        const [integer, decimal] = num.split(".");
        const formattedInteger = parseFloat(integer || "0").toLocaleString('en-US', {
            maximumFractionDigits: 0
        });

        if (decimal) {
            return `${formattedInteger}.${decimal}`;
        }
        return formattedInteger;
    }

    /**
     * Shows visual feedback when digit limit is exceeded
     */
    showLimitExceededFeedback() {
        this.calculatorDisplay.classList.add("limit-exceeded");
        setTimeout(() => {
            this.calculatorDisplay.classList.remove("limit-exceeded");
        }, 500);
    }

    /**
     * Toggles the sign of the current input between positive and negative
     */
    toggleSign() {
        if (this.currentInput === "" || this.currentInput === "0") return;

        // If showing a result, treat it as a new starting number
        if (this.isResultDisplayed) {
            this.expression = [];
            this.isResultDisplayed = false;
        }

        // Toggle the sign of current input
        this.currentInput = (parseFloat(this.currentInput) * -1).toString();
        
        // Rebuild the operation string without changing the expression array
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Clear the calculator display
     */
    clear() {
        this.currentInput = "";
        this.expression = [];
        this.parenthesesCount = 0;
        this.operationString = "";
        this.isResultDisplayed = false;
        this.updateDisplay();
    }

    /**
     * Handles number input
     * @param {string} num - The number pressed
     */
    handleNumber(num) {
        if (this.isResultDisplayed) {
            this.clear();
        }

        // Check for implicit multiplication after closing parenthesis
        if (this.expression.length > 0 && 
            this.expression[this.expression.length - 1] === ')' && 
            !this.currentInput) {
            
            // Add the current expression to array
            this.expression.push('*');
        }

        // Handle digit limits
        if (this.currentInput.length >= this.MAX_DIGITS) {
            this.showLimitExceededFeedback();
            return;
        }

        // Update currentInput
        if (this.currentInput === "0" && num !== ".") {
            this.currentInput = num;
        } else {
            this.currentInput += num;
        }

        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Handles deletion of the last entered character
     * If displaying a result, clears the calculator
     * Otherwise removes the last entered digit or operator
     */
    handleDelete() {
        // Handle result state
        if (this.isResultDisplayed) {
            this.clear();
            return;
        }

        // If we have a current input, delete from it first
        if (this.currentInput) {
            this.currentInput = this.currentInput.slice(0, -1);
        } 
        // If no current input, remove the last item from expression array
        else if (this.expression.length > 0) {
            const lastToken = this.expression.pop();
            // Update parentheses count when deleting parentheses
            if (lastToken === '(') {
                this.parenthesesCount--;
            } else if (lastToken === ')') {
                this.parenthesesCount++;
            }
        }

        // Rebuild the operation string
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Handles opening parenthesis
     */
    handleLeftParen() {
        if (this.isResultDisplayed) {
            this.clear();
        }

        // Add implicit multiplication if needed
        if (this.currentInput) {
            this.expression.push(this.currentInput);
            this.expression.push("*");
            this.currentInput = "";
        }

        this.expression.push("(");
        this.parenthesesCount++;
        
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Handles closing parenthesis
     */
    handleRightParen() {
        if (this.parenthesesCount <= 0) return;

        if (this.currentInput) {
            this.expression.push(this.currentInput);
            this.currentInput = "";
        }

        this.expression.push(")");
        this.parenthesesCount--;
        
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Build operation string from expression array
     */
    buildOperationString() {
        let str = this.expression.map(token => {
            if (token === '(' || token === ')') {
                return token;
            }
            if (['+', '-', '*', '/'].includes(token)) {
                return ` ${token} `;
            }
            return token;
        }).join('');
        
        str = str.replace(/\s+/g, ' ').trim();
        
        if (this.currentInput) {
            str += str ? ` ${this.currentInput}` : this.currentInput;
        }
        
        this.operationString = str;
    }
}

// Change to default export
export default Calculator; 
