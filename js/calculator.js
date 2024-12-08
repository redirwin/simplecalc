/**
 * Calculator state management and operations
 */class Calculator {
    constructor() {
        this.currentInput = "0";
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

        // Initialize display with "0"
        this.updateDisplay();

        // Add new state for expression building
        this.expression = [];  // Array to store full expression tokens
        this.parenthesesCount = 0;

        // Initialize history from localStorage or empty array if none exists
        try {
            this.history = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
        } catch (e) {
            this.history = [];
            console.error('Error loading history:', e);
        }
        
        // Initialize history UI elements
        this.historyList = document.querySelector(".history-list");
        this.updateHistoryDisplay();

        // Add history clear button listener
        document.querySelector(".history-clear").addEventListener("click", () => {
            this.clearHistory();
        });

        this.initializeEventListeners();
        this.initializeTooltips();

        // Initialize utility panels
        this.initializeUtilityPanels();

        this.activePanel = null; // Track currently open panel
        
        // Update history button event listener to use togglePanel
        document.querySelector("[data-action='history']").addEventListener("click", () => {
            this.togglePanel("history");
        });

        // Update history close button
        document.querySelector(".history-close").addEventListener("click", () => {
            this.togglePanel("history");
        });

        // Update history overlay
        document.querySelector(".history-overlay").addEventListener("click", () => {
            this.togglePanel("history");
        });
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

            // Space for button activation
            button.addEventListener("keydown", (e) => {
                if (e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (button.dataset.action === "parenthesis") {
                        this.handleParenthesis();
                    } else {
                        button.click();
                    }
                }
            });
        });

        // Add keyboard support at document level
        document.addEventListener("keydown", (e) => this.handleKeyboardInput(e));

        // Close history panel when clicking overlay
        document.querySelector(".history-overlay").addEventListener("click", () => {
            this.closeHistoryPanel();
        });

        // Close history panel when clicking close button
        document.querySelector(".history-close").addEventListener("click", () => {
            this.closeHistoryPanel();
        });

        // Add keyboard trap for history panel
        document.addEventListener('keydown', (e) => {
            const historyPanel = document.querySelector(".history-panel");
            
            // If history panel is closed, make its elements non-tabbable
            const historyElements = historyPanel.querySelectorAll('button, [tabindex="0"]');
            historyElements.forEach(element => {
                element.setAttribute('tabindex', historyPanel.classList.contains('open') ? '0' : '-1');
            });

            if (!historyPanel.classList.contains('open')) return;

            if (e.key === 'Tab') {
                this.handleHistoryPanelTab(e);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.closeHistoryPanel();
            }
        });
    }

    /**
     * Handles keyboard input
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeyboardInput(e) {
        // Special keys that should work even when panels are open
        if (e.key === "F1" || e.key === "F2" || e.key.toLowerCase() === "h" || e.key === "Escape") {
            return; // Let these events bubble up to the panel handlers
        }

        // Skip other keyboard handling if any panel is open
        if (this.activePanel) return;

        // Skip Space when focus is on calculator button
        if (e.target.classList.contains('calculator-button') && e.key === " ") {
            return;
        }

        // Handle numbers (both regular and numpad)
        if ((e.key >= "0" && e.key <= "9") || 
            (e.code >= "Numpad0" && e.code <= "Numpad9")) {
            const num = e.code.startsWith("Numpad") ? 
                e.code.slice(-1) : e.key;
            this.handleNumber(num);
        } 
        // Handle decimal point (both regular and numpad)
        else if (e.key === "." || e.code === "NumpadDecimal") {
            this.handleAction("decimal");
        } 
        // Handle operators (both regular and numpad)
        else if (["+", "-", "*", "/"].includes(e.key) || 
                 ["NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide"].includes(e.code)) {
            const opMap = {
                "NumpadAdd": "+",
                "NumpadSubtract": "-",
                "NumpadMultiply": "*",
                "NumpadDivide": "/"
            };
            const op = e.code in opMap ? opMap[e.code] : e.key;
            this.setOperation(op);
        } 
        // Handle equals/enter (both regular and numpad)
        else if (e.key === "=" || e.code === "NumpadEqual" || 
                 e.key === "Enter" || e.code === "NumpadEnter") {
            e.preventDefault();
            if (this.hasValidExpression()) {
                this.handleAction("calculate");
            }
        } else if (e.key.toLowerCase() === "c" || 
                   e.code === "NumLock" || 
                   (e.code === "Delete" && e.code.startsWith("Numpad"))) {
            e.preventDefault();
            this.handleAction("clear");
        } else if (e.key === "Backspace" || 
                   (e.key === "Delete" && !e.code.startsWith("Numpad"))) {
            this.handleAction("delete");
        } else if (e.key === "%") {
            e.preventDefault();
            this.handleAction("percent");
        } else if (e.key === "(" || e.key === ")") {
            this.handleKeyboardParenthesis(e.key);
        } else if (e.key.toLowerCase() === "r") {
            this.handleAction("sqrt");
        } else if (e.key.toLowerCase() === "s") {
            this.handleAction("square");
        } else if (e.key === "!") {
            this.handleAction("toggleSign");
        } else if (e.key.toLowerCase() === "h") {
            e.preventDefault();
            this.togglePanel("history");
        }
    }

    /**
     * Check if there's a valid expression to evaluate
     * @returns {boolean}
     */
    hasValidExpression() {
        return (
            (this.currentInput && this.currentInput !== "0") || 
            this.expression.length > 0
        );
    }

    /**
     * Handles direct parenthesis input from keyboard
     * @param {string} key - The parenthesis key pressed
     */
    handleKeyboardParenthesis(key) {
        if (this.isResultDisplayed) {
            this.clear();
        }

        // Add current input to expression if it exists
        if (this.currentInput) {
            // Handle implicit multiplication for opening parenthesis
            if (key === "(" && !isNaN(this.currentInput)) {
                this.expression.push(this.currentInput);
                this.expression.push("*");
            } else {
                this.expression.push(this.currentInput);
            }
            this.currentInput = "";
        }

        // Update parentheses count
        if (key === "(") {
            this.parenthesesCount++;
        } else {
            // Only allow closing if we have open parentheses
            if (this.parenthesesCount <= 0) return;
            this.parenthesesCount--;
        }

        this.expression.push(key);
        this.buildOperationString();
        this.updateDisplay();
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
                this.openHistoryPanel();
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

        // Start fresh input after opening parenthesis
        if (this.expression.length > 0 && 
            this.expression[this.expression.length - 1] === "(") {
            this.currentInput = number;
        }
        // Replace initial "0"
        else if (this.currentInput === "0") {
            this.currentInput = number;
        }
        // Normal append
        else if (this.currentInput.length < this.MAX_DIGITS) {
            this.currentInput += number;
        }

        this.isResultDisplayed = false;
        this.buildOperationString();  // Explicitly rebuild operation string
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
        if (this.currentInput === "") {
            // If no current input, use "0" as the starting number
            this.currentInput = "0";
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
     * Performs the calculation based on current expression
     */
    calculate() {
        try {
            // Join the expression array with the current input
            if (this.currentInput) {
                // Check for implicit multiplication before adding current input
                const lastToken = this.expression[this.expression.length - 1];
                if (lastToken === ')') {
                    // Ensure multiplication operator is present
                    if (this.expression[this.expression.length - 1] !== '*') {
                        this.expression.push('*');
                    }
                }
                this.expression.push(this.currentInput);
            }
            
            // Create operation string before evaluation
            const operationString = this.expression.join(' ');
            
            // Evaluate the expression
            const result = this.evaluateParentheses(operationString);
            
            // Format and display result
            this.currentInput = this.formatCalculationResult(result);
            
            // Store the formatted expression with explicit multiplication symbols
            this.operationString = this.expression.map(token => {
                if (token === '*') return '×';
                if (token === '/') return '÷';
                return token;
            }).join(' ');
            
            this.expression = [];
            this.isResultDisplayed = true;
            
            this.updateDisplay();
            
            // Add successful calculation to history with correct formatting
            if (this.isResultDisplayed) {
                this.addToHistory({
                    expression: this.operationString,
                    displayExpression: `${this.operationString} =`,
                    result: this.currentInput
                });
            }
            
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
     * Calculate square root of current expression or input
     */
    calculateSquareRoot() {
        // If no input and no expression, return
        if (this.currentInput === "" && this.expression.length === 0) return;
        
        // If we have a pending expression, evaluate it first
        if (this.expression.length > 0) {
            if (this.currentInput) {
                this.expression.push(this.currentInput);
            }
            const expressionResult = this.evaluateExpression(this.expression.join(' '));
            this.currentInput = this.roundResult(expressionResult).toString();
            this.expression = [];
        }
        
        const value = parseFloat(this.currentInput);
        const originalValue = this.roundResult(value).toString();
        
        if (value < 0) {
            this.currentInput = "Error";
        } else {
            const sqrtResult = Math.sqrt(value);
            // Use different precision based on number type
            if (sqrtResult >= 1000000 || sqrtResult < 0.000001) {
                // Large/small numbers: use exponential notation
                this.currentInput = sqrtResult.toExponential(5); // 6 significant digits
            } else if (Number.isInteger(sqrtResult)) {
                // Whole numbers: no decimal places
                this.currentInput = sqrtResult.toString();
            } else if (this.isIrrational(sqrtResult)) {
                // Irrational results: show up to 10 digits
                this.currentInput = Number(sqrtResult.toPrecision(10)).toString();
            } else {
                // Regular numbers: 6 significant digits
                this.currentInput = Number(sqrtResult.toPrecision(6)).toString();
            }
        }
        
        // Update operation string with clear notation
        this.operationString = `√(${originalValue})`;
        this.isResultDisplayed = true;
        
        // Fix: Pass properly structured history object
        this.addToHistory({
            expression: this.operationString,
            displayExpression: `${this.operationString} =`,
            result: this.currentInput
        });
        
        this.updateDisplay();
    }

    /**
     * Calculate square of current expression or input
     */
    calculateSquare() {
        // If no input and no expression, return
        if (this.currentInput === "" && this.expression.length === 0) return;
        
        // If we have a pending expression, evaluate it first
        if (this.expression.length > 0) {
            if (this.currentInput) {
                this.expression.push(this.currentInput);
            }
            const expressionResult = this.evaluateExpression(this.expression.join(' '));
            this.currentInput = this.roundResult(expressionResult).toString();
            this.expression = [];
        }
        
        const value = parseFloat(this.currentInput);
        const originalValue = this.roundResult(value).toString();
        
        const squareResult = Math.pow(value, 2);
        // Use same precision rules as square root
        if (squareResult >= 1000000 || squareResult < 0.000001) {
            this.currentInput = squareResult.toExponential(5);
        } else if (Number.isInteger(squareResult)) {
            this.currentInput = squareResult.toString();
        } else {
            this.currentInput = Number(squareResult.toPrecision(6)).toString();
        }
        
        // Update operation string with clear notation
        this.operationString = `(${originalValue})²`;
        this.isResultDisplayed = true;
        
        // Fix: Pass properly structured history object
        this.addToHistory({
            expression: this.operationString,
            displayExpression: `${this.operationString} =`,
            result: this.currentInput
        });
        
        this.updateDisplay();
    }

    /**
     * Helper method to check if a number appears to be irrational
     * @param {number} num - The number to check
     * @returns {boolean} - True if the number appears to be irrational
     */
    isIrrational(num) {
        // Convert to string and check decimal places
        const str = num.toString();
        if (!str.includes('.')) return false;
        
        const decimals = str.split('.')[1];
        // Consider "irrational" if more than 6 non-zero decimal places
        return decimals.length > 6 && !decimals.endsWith('0'.repeat(decimals.length - 6));
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
            this.operatorDisplay.textContent = this.formatOperatorDisplay(`${this.operationString} =`);
        } else {
            if (this.operationString) {
                // Format numbers and operators in the display string
                const formattedDisplay = this.operationString
                    .replace(/\b\d+(\.\d+)?\b/g, match => this.formatNumber(match))
                    .replace(/\//g, '÷');
                
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
        const lastToken = this.expression[this.expression.length - 1];
        if (lastToken === ')') {
            // Add multiplication operator to the actual expression
            this.expression.push('*');
            this.currentInput = num;  // Start fresh number input
            this.isResultDisplayed = false;
        } else {
            // Normal number input handling
            if (this.currentInput.length >= this.MAX_DIGITS) {
                this.showLimitExceededFeedback();
                return;
            }

            if (this.currentInput === "0") {
                this.currentInput = num;
            } else {
                this.currentInput += num;
            }
        }

        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Handles deletion of the last entered character
     */
    handleDelete() {
        // If showing a result, clear everything instead of backspacing
        if (this.isResultDisplayed) {
            this.clearDisplay();
            return;
        }

        // If we have current input, backspace it
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1);
            // Only set to "0" if we've backspaced everything out
            if (this.currentInput === "" && this.expression.length === 0) {
                this.currentInput = "0";
            }
        }
        // If no current input and we have an expression, remove the operator
        else if (this.currentInput === "" && this.expression.length > 0) {
            this.expression.pop();  // Remove the operator
            if (this.expression.length > 0) {
                this.currentInput = this.expression.pop();  // Get previous number
            } else {
                this.currentInput = "0";  // Only set to "0" when expression is empty
            }
        }

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

        // Add current input to expression if it exists and is not the initial "0"
        if (this.currentInput && this.currentInput !== "0") {
            // Handle implicit multiplication for opening parenthesis
            if (this.parenthesesCount === 0 && !isNaN(this.currentInput)) {
                this.expression.push(this.currentInput);
                this.expression.push("*");
            } else {
                this.expression.push(this.currentInput);
            }
        }

        // Clear currentInput (don't set to "0")
        this.currentInput = "";
        
        // Determine whether to add opening or closing parenthesis
        if (this.parenthesesCount === 0 || 
            ["+", "-", "*", "/"].includes(this.expression[this.expression.length - 1])) {
            this.parenthesesCount++;
            this.expression.push("(");
        } else {
            this.parenthesesCount--;
            this.expression.push(")");
        }

        this.buildOperationString();
        this.updateDisplay();
        this.isResultDisplayed = false;
    }

    /**
     * Handles operator input
     * @param {string} operator - The operator pressed
     */
    handleOperator(operator) {
        if (this.isResultDisplayed) {
            // Convert the result into the first part of the new expression
            this.expression = [];
            this.expression.push(this.currentInput);
            this.currentInput = "";
            this.isResultDisplayed = false;
        }

        // Add current input and operator to expression
        if (this.currentInput) {
            const lastToken = this.expression[this.expression.length - 1];
            if (lastToken === ')' && this.expression[this.expression.length - 2] !== '*') {
                this.expression.push('*');
            }
            this.expression.push(this.currentInput);
        }

        this.expression.push(operator);
        this.currentInput = "";

        this.buildOperationString();
        this.updateDisplay();
    }

    /**
     * Build operation string from expression array
     */
    buildOperationString() {
        // First, ensure implicit multiplication is maintained in expression array
        for (let i = 0; i < this.expression.length - 1; i++) {
            if (this.expression[i] === ')' && 
                this.expression[i + 1] !== '*' && 
                this.expression[i + 1] !== '+' && 
                this.expression[i + 1] !== '-' && 
                this.expression[i + 1] !== '/' && 
                this.expression[i + 1] !== ')') {
                // Insert multiplication operator
                this.expression.splice(i + 1, 0, '*');
                i++; // Skip the inserted operator
            }
        }

        // Convert expression array to display string
        let str = this.expression.map(token => {
            if (token === '(' || token === ')') {
                return token;
            }
            if (token === '%') {
                return ` ${token}`;
            }
            if (['+', '-', '*', '/'].includes(token)) {
                const displayToken = token === '/' ? '÷' : 
                                   token === '*' ? '×' : 
                                   token;
                return ` ${displayToken} `;
            }
            return token;
        }).join('');
        
        str = str.replace(/\s+/g, ' ').trim();
        
        // Add current input with proper formatting
        if (this.currentInput) {
            const lastToken = this.expression[this.expression.length - 1];
            if (lastToken === ')') {
                str += ` × ${this.currentInput}`;
            } else {
                str += str ? ` ${this.currentInput}` : this.currentInput;
            }
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
     * Handles tab key navigation within history panel
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleHistoryPanelTab(e) {
        const historyPanel = document.querySelector(".history-panel");
        const focusableElements = historyPanel.querySelectorAll(
            'button, [href], [tabindex="0"], .history-entry'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // If shift + tab on first element, move to last
        if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
        }
        // If tab on last element, move to first
        else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
        }
        // Prevent tabbing to elements outside panel
        else if (!Array.from(focusableElements).includes(document.activeElement)) {
            e.preventDefault();
            firstFocusable.focus();
        }
    }

    /**
     * Opens history panel and sets up focus management
     */
    openHistoryPanel() {
        this.togglePanel("history");
    }

    /**
     * Close history panel and restore focus
     */
    closeHistoryPanel() {
        this.togglePanel("history");
    }

    /**
     * Adds a calculation to history
     * @param {{ expression: string, displayExpression: string, result: string }} historyData
     */
    addToHistory(historyData) {
        const historyEntry = {
            ...historyData,
            timestamp: Date.now()
        };

        this.history.unshift(historyEntry);
        if (this.history.length > 100) {
            this.history.pop();
        }

        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Error saving history:', e);
        }
        this.updateHistoryDisplay();
    }

    /**
     * Updates the history panel display
     */
    updateHistoryDisplay() {
        if (!this.historyList) return;
        
        this.historyList.innerHTML = this.history.length ? 
            this.history.map((entry, index) => `
                <div class="history-entry" 
                     data-index="${index}" 
                     tabindex="-1" 
                     role="button" 
                     aria-label="Restore calculation: ${entry.displayExpression} ${this.formatNumber(entry.result)}"
                     title="Press Enter to restore this calculation">
                    <div class="history-expression">${entry.displayExpression}</div>
                    <div class="history-result">${this.formatNumber(entry.result)}</div>
                </div>
            `).join('') : 
            '<div class="history-empty">No calculations yet</div>';

        // Add click and keyboard listeners to history entries
        document.querySelectorAll('.history-entry').forEach(entry => {
            entry.addEventListener('click', () => {
                this.restoreHistoryEntry(parseInt(entry.dataset.index));
            });

            entry.addEventListener('keydown', (e) => {
                if (e.key === "Enter" && !e.ctrlKey || e.key === " ") {
                    e.preventDefault();
                    this.restoreHistoryEntry(parseInt(entry.dataset.index));
                }
            });
        });
    }

    /**
     * Restores a history entry to the calculator
     * @param {number} index - The index of the history entry to restore
     */
    restoreHistoryEntry(index) {
        const historyEntry = this.history[index];
        this.currentInput = historyEntry.result;
        this.isResultDisplayed = true;
        this.operationString = historyEntry.expression;
        this.updateDisplay();
        this.closeHistoryPanel();
    }

    /**
     * Clears calculation history
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistoryDisplay();
        this.closeHistoryPanel();
    }

    /**
     * Format expression for display, replacing operators with display symbols
     * @param {string} expression - The expression to format
     * @returns {string} - Formatted expression
     */
    formatOperatorDisplay(expression) {
        return expression.replace(/\//g, '÷').replace(/\*/g, '×');
    }

    /**
     * Initialize tooltips for calculator buttons
     */
    initializeTooltips() {
        const tooltips = {
            'history': 'History (H)',
            'delete': 'Backspace',
            'parenthesis': '( or )',
            'percent': '%',
            'sqrt': 'Square Root (R)',
            'square': 'Square (S)',
            'toggleSign': 'Toggle Sign (!)',
            'clear': 'Clear (Esc)',
            'calculate': 'Calculate (Enter or =)',
            'decimal': 'Decimal (.)'
        };

        const operatorTooltips = {
            '+': 'Add (+)',
            '-': 'Subtract (-)',
            '*': 'Multiply (*)',
            '/': 'Divide (/)'
        };

        document.querySelectorAll('.calculator-button').forEach(button => {
            let tooltip = '';
            
            if (button.dataset.action) {
                tooltip = tooltips[button.dataset.action] || '';
            } else if (button.dataset.operation) {
                tooltip = operatorTooltips[button.dataset.operation] || '';
            } else if (button.dataset.number) {
                tooltip = `Number (${button.dataset.number})`;
            }

            if (tooltip) {
                button.setAttribute('title', tooltip);
                button.setAttribute('aria-label', tooltip);
            }
        });
    }

    /**
     * Handles clear action
     */
    handleClear() {
        this.currentInput = "0";
        this.previousInput = "";
        this.operation = null;
        this.isResultDisplayed = false;
        this.lastNumber = null;
        this.lastOperation = null;
        this.operationString = "";
        this.expression = [];
        this.parenthesesCount = 0;
        this.updateDisplay();
    }

    /**
     * Initialize utility panels and their event listeners
     */
    initializeUtilityPanels() {
        // Info panel
        document.querySelector(".info-button").addEventListener("click", () => {
            this.togglePanel("info");
        });
        
        document.querySelector(".info-close").addEventListener("click", () => {
            this.togglePanel("info");
        });
        
        document.querySelector(".info-overlay").addEventListener("click", () => {
            this.togglePanel("info");
        });

        // About panel
        document.querySelector(".about-button").addEventListener("click", () => {
            this.togglePanel("about");
        });
        
        document.querySelector(".about-close").addEventListener("click", () => {
            this.togglePanel("about");
        });
        
        document.querySelector(".about-overlay").addEventListener("click", () => {
            this.togglePanel("about");
        });

        // History panel
        document.querySelector("[data-action='history']").addEventListener("click", () => {
            this.togglePanel("history");
        });
        
        document.querySelector(".history-close").addEventListener("click", () => {
            this.togglePanel("history");
        });
        
        document.querySelector(".history-overlay").addEventListener("click", () => {
            this.togglePanel("history");
        });

        // Add keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            if (e.key === "F1") {
                e.preventDefault();
                this.togglePanel("info");
            } else if (e.key === "F2") {
                e.preventDefault();
                this.togglePanel("about");
            } else if (e.key.toLowerCase() === "h") {  // Handle both upper and lowercase H
                e.preventDefault();
                this.togglePanel("history");
            } else if (e.key === "Escape") {
                // Check if any panel is open
                const infoOpen = document.querySelector(".info-panel.open");
                const aboutOpen = document.querySelector(".about-panel.open");
                const historyOpen = document.querySelector(".history-panel.open");
                
                if (infoOpen || aboutOpen || historyOpen) {
                    e.preventDefault(); // Prevent extension popup from closing
                    if (this.activePanel) {
                        this.togglePanel(this.activePanel);
                    }
                }
            }
        });
    }

    /**
     * Toggle utility panel visibility with proper sequencing
     * @param {string} panelType - Type of panel ("info", "about", or "history")
     */
    togglePanel(panelType) {
        const panel = document.querySelector(`.${panelType}-panel`);
        const overlay = document.querySelector(`.${panelType}-overlay`);
        const isOpen = panel.classList.contains("open");

        // If we're trying to open a new panel while another is open
        if (!isOpen && this.activePanel && this.activePanel !== panelType) {
            // Close the currently active panel first
            const activePanel = document.querySelector(`.${this.activePanel}-panel`);
            const activeOverlay = document.querySelector(`.${this.activePanel}-overlay`);
            
            activePanel.classList.remove("open");
            activeOverlay.classList.remove("show");
            
            // Wait for close animation to complete before opening new panel
            setTimeout(() => {
                panel.classList.add("open");
                overlay.classList.add("show");
                this.activePanel = panelType;
            }, 300); // Match the CSS transition duration
        } else {
            // Normal toggle behavior when no other panel is open
            if (isOpen) {
                panel.classList.remove("open");
                overlay.classList.remove("show");
                this.activePanel = null;
                // Return focus to calculator
                document.querySelector(".calculator-button[data-number='0']").focus();
            } else {
                panel.classList.add("open");
                overlay.classList.add("show");
                this.activePanel = panelType;
            }
        }
    }
}

export default Calculator; 
