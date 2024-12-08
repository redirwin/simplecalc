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

        // Close history panel when clicking overlay
        document.querySelector(".history-overlay").addEventListener("click", () => {
            this.closeHistoryPanel();
        });

        // Close history panel when clicking close button
        document.querySelector(".history-close").addEventListener("click", () => {
            this.closeHistoryPanel();
        });
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardInput(e) {
        if (e.key >= "0" && e.key <= "9") {
            this.handleNumber(e.key);
        } else if (e.key === ".") {
            this.handleAction("decimal");
        } else if (["+", "-", "*", "/"].includes(e.key)) {
            this.setOperation(e.key);
        } else if (e.key === "Enter" || e.key === "=") {
            e.preventDefault();
            this.handleAction("calculate");
        } else if (e.key === "Escape") {
            this.handleAction("clear");
        } else if (e.key === "Backspace" || e.key === "Delete") {
            this.handleAction("delete");
        } else if (e.key === "%") {
            e.preventDefault();
            this.handleAction("percent");
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
            case "parenthesis":
                this.handleParenthesis();
                break;
            case "percent":  // Make sure this case exists and is correct
                this.handlePercentage();
                break;
            case "sqrt":
                this.calculateSquareRoot();
                break;
            case "square":
                this.calculateSquare();
                break;
            case "history":
                const historyPanel = document.querySelector(".history-panel");
                const historyOverlay = document.querySelector(".history-overlay");
                const historyButton = document.querySelector("[data-action='history']");
                
                historyPanel.classList.toggle("open");
                historyOverlay.classList.toggle("show");
                historyButton.classList.toggle("active");
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
        const lastToken = this.expression[this.expression.length - 1];
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
     * Calculates the result of the current expression
     */
    calculate() {
        // Handle empty calculator case
        if (!this.currentInput && this.expression.length === 0) {
            return;
        }

        try {
            // Create a copy of the expression array
            let expressionToEvaluate = [...this.expression];
            
            // Add current input to expression if it exists
            if (this.currentInput) {
                expressionToEvaluate.push(this.currentInput);
            }
            
            // Join the expression with spaces for evaluation
            const operationString = expressionToEvaluate.join(' ');
            
            // Calculate result
            const result = this.evaluateParentheses(operationString);
            
            // Format and display result
            this.currentInput = this.formatCalculationResult(result);
            this.expression = [];
            this.isResultDisplayed = true;
            this.operationString = operationString; // Store for display
            this.updateDisplay();
            
        } catch (error) {
            this.currentInput = "Error";
            this.expression = [];
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
        // Convert expression to tokens
        let tokens = expression.split(' ').filter(token => token !== '');
        
        // First pass: handle percentages
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '%') {
                const percentValue = parseFloat(tokens[i - 1]);
                
                // Look for operator before the percentage value
                let baseNumber = null;
                if (i >= 3 && ['+', '-', '*', '/'].includes(tokens[i - 2])) {
                    baseNumber = parseFloat(tokens[i - 3]);
                }
                
                let result;
                if (baseNumber !== null) {
                    // Calculate percentage based on the number before the operator
                    result = (percentValue / 100) * baseNumber;
                    
                    if (tokens[i - 2] === '+' || tokens[i - 2] === '-') {
                        // For + and -, replace just the percentage part
                        tokens.splice(i - 1, 2, result.toString());
                    } else {
                        // For * and /, convert to decimal
                        result = percentValue / 100;
                        tokens.splice(i - 1, 2, result.toString());
                    }
                } else {
                    // Direct percentage calculation (like 20%12)
                    const rightNum = i + 1 < tokens.length ? parseFloat(tokens[i + 1]) : null;
                    if (rightNum !== null) {
                        result = (percentValue / 100) * rightNum;
                        tokens.splice(i - 1, 3, result.toString());
                    } else {
                        result = percentValue / 100;
                        tokens.splice(i - 1, 2, result.toString());
                    }
                }
                i--; // Adjust index after splice
            }
        }
        
        // Continue with existing evaluation logic...
        // Handle negative numbers
        const processedTokens = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token === '-' && 
                i + 1 < tokens.length && 
                !isNaN(tokens[i + 1]) && 
                (i === 0 || ['+', '-', '*', '/'].includes(tokens[i - 1]))) {
                processedTokens.push((-parseFloat(tokens[i + 1])).toString());
                i++; // Skip the next token
            } else {
                processedTokens.push(token);
            }
        }

        // First pass: multiplication and division
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

        // Second pass: addition and subtraction
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
        this.operationString = `(${this.currentInput})`;
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
            if (this.operationString) {
                // Format numbers in the display string
                const formattedDisplay = this.operationString.replace(/\b\d+(\.\d+)?\b/g, match => this.formatNumber(match));
                
                // Set the main display first
                this.display.value = formattedDisplay;
                
                // Check if content is overflowing
                const isOverflowing = this.display.scrollWidth > this.display.clientWidth;
                
                if (isOverflowing) {
                    // Show full expression in operator display only when overflowing
                    this.operatorDisplay.textContent = formattedDisplay;
                } else {
                    // Clear operator display if not overflowing
                    this.operatorDisplay.textContent = "";
                }
                
                // Ensure we're scrolled to the end
                requestAnimationFrame(() => {
                    this.display.scrollLeft = this.display.scrollWidth;
                });
            } else {
                this.display.value = this.formatNumber(this.currentInput || "0");
                this.operatorDisplay.textContent = "";
            }
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
            
            // If we just removed an operator and the last token is a number,
            // move it to currentInput for digit-by-digit deletion
            if (['+', '-', '*', '/', '%'].includes(lastToken) && 
                this.expression.length > 0 && 
                !isNaN(this.expression[this.expression.length - 1])) {
                this.currentInput = this.expression.pop();
            }
        }

        // Rebuild the operation string
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Handles context-aware parenthesis insertion
     */
    handleParenthesis() {
        if (this.isResultDisplayed) {
            this.clear();
        }

        // Determine if we should close a parenthesis
        const shouldClose = 
            // Must have open parentheses
            this.parenthesesCount > 0 && 
            // Must have either current input or last token isn't an operator or opening parenthesis
            (this.currentInput || 
             (this.expression.length > 0 && 
              !['+', '-', '*', '/', '('].includes(this.expression[this.expression.length - 1])));

        if (shouldClose) {
            // Add current input to expression if it exists
            if (this.currentInput) {
                this.expression.push(this.currentInput);
                this.currentInput = "";
            }
            this.expression.push(")");
            this.parenthesesCount--;
        } else {
            // Handle opening parenthesis
            // Add implicit multiplication only if there's a number or closing parenthesis before
            if (this.currentInput || 
                (this.expression.length > 0 && 
                 this.expression[this.expression.length - 1] === ')')) {
                if (this.currentInput) {
                    this.expression.push(this.currentInput);
                }
                this.expression.push("*");
                this.currentInput = "";
            }
            this.expression.push("(");
            this.parenthesesCount++;
        }
        
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
            if (token === '%') {
                return ` ${token}`; // Add space before %
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

    /**
     * Handles percentage calculations based on context
     */
    handlePercentage() {
        if (this.isResultDisplayed) {
            this.clear();
        }

        // Need current input to proceed
        if (this.currentInput === "") return;

        // Add current number to expression array
        if (this.currentInput) {
            this.expression.push(this.currentInput);
        }
        
        // Add the percentage operator
        this.expression.push('%');
        
        // Clear current input for next number
        this.currentInput = "";
        
        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Close history panel
     */
    closeHistoryPanel() {
        const historyPanel = document.querySelector(".history-panel");
        const historyOverlay = document.querySelector(".history-overlay");
        const historyButton = document.querySelector("[data-action='history']");
        
        historyPanel.classList.remove("open");
        historyOverlay.classList.remove("show");
        historyButton.classList.remove("active");
    }
}

// Change to default export
export default Calculator; 
