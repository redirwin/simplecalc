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

        this.display = document.getElementById("display");
        this.operatorDisplay = document.getElementById("operator-display");
        this.MAX_DIGITS = 15;
        this.calculatorDisplay = document.querySelector(".calculator-display");

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
        }
    }

    /**
     * Handle special calculator actions
     * @param {string} action - The action to perform
     */
    handleAction(action) {
        switch (action) {
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
        }
    }

    /**
     * Append a number to the current input
     * @param {string} number - The number to append
     */
    appendNumber(number) {
        if (this.isResultDisplayed) {
            this.currentInput = "";
            this.isResultDisplayed = false;
        }

        // Handle single input of long number
        if (number.length > this.MAX_DIGITS) {
            number = number.slice(0, this.MAX_DIGITS);
        }

        // Get count of digits (excluding decimal point and minus sign)
        const currentDigits = this.currentInput
            .replace(/[.-]/g, '')
            .length;

        // Check if adding another digit would exceed the limit
        if (currentDigits >= this.MAX_DIGITS) {
            this.showLimitExceededFeedback();
            return;
        }

        // Prevent multiple leading zeros
        if (number === "0" && this.currentInput === "0") {
            return;
        }

        // Replace single leading zero with new number
        if (this.currentInput === "0" && number !== ".") {
            this.currentInput = number;
        } else {
            this.currentInput += number;
        }

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
        if (this.currentInput === "" && this.previousInput === "") return;

        if (this.currentInput === "" && this.previousInput !== "") {
            this.operation = op;
            this.updateOperatorDisplay(op);
            return;
        }

        if (this.operation !== null) {
            this.calculate();
        }

        this.operation = op;
        if (this.isResultDisplayed) {
            this.previousInput = this.currentInput;
            this.currentInput = "";
            this.isResultDisplayed = false;
        } else if (this.currentInput !== "") {
            this.previousInput = this.currentInput;
            this.currentInput = "";
        }
        this.updateOperatorDisplay(op);
    }

    /**
     * Update the operator display
     * @param {string} op - The operation to display
     */
    updateOperatorDisplay(op) {
        this.operatorDisplay.textContent = op;
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
     * Performs the calculation
     */
    calculate() {
        if (!this.operation || !this.previousInput || this.currentInput === "") return;

        let result;
        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);

        switch (this.operation) {
            case "+":
                result = prev + current;
                break;
            case "-":
                result = prev - current;
                break;
            case "*":
                result = prev * current;
                break;
            case "/":
                result = current !== 0 ? prev / current : "Error";
                break;
            default:
                return;
        }

        if (result === "Error") {
            this.currentInput = "Error";
            this.previousInput = "";
        } else {
            // Format the result to prevent excessive decimal places
            this.currentInput = this.formatCalculationResult(result);
            this.previousInput = "";
        }
        
        this.lastNumber = this.currentInput;
        this.lastOperation = this.operation;
        this.operation = null;
        this.isResultDisplayed = true;
        this.updateOperatorDisplay("");
        this.updateDisplay();
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
        if (value < 0) {
            this.display.value = "Error";
            return;
        }
        this.currentInput = Math.sqrt(value).toString();
        this.isResultDisplayed = true;
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }

    /**
     * Calculate square of current input
     */
    calculateSquare() {
        if (this.currentInput === "") return;
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
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }

    /**
     * Update the calculator display
     */
    updateDisplay() {
        this.display.value = this.formatNumber(this.currentInput);
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
        if (this.currentInput === "") return;
        
        if (this.currentInput.startsWith("-")) {
            this.currentInput = this.currentInput.slice(1);
        } else {
            this.currentInput = "-" + this.currentInput;
        }
        
        this.updateDisplay();
    }

    /**
     * Clear the calculator display
     */
    clear() {
        this.currentInput = "";
        this.previousInput = "";
        this.operation = null;
        this.lastNumber = null;
        this.lastOperation = null;
        this.isResultDisplayed = false;
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }
}

// Change to default export
export default Calculator; 
