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
        }
    }

    /**
     * Append a number to the current input
     * @param {string} number - The number to append
     */
    appendNumber(number) {
        console.log("Before appendNumber:", {
            currentInput: this.currentInput,
            previousInput: this.previousInput,
            operation: this.operation,
            operationString: this.operationString
        });

        if (this.isResultDisplayed) {
            // Clear everything and start fresh when typing a new number after a result
            this.currentInput = "";
            this.previousInput = "";
            this.operation = null;
            this.operationString = "";
            this.isResultDisplayed = false;
            this.operatorDisplay.textContent = "";
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

        // Update currentInput
        if (this.currentInput === "0" && number !== ".") {
            this.currentInput = number;
        } else {
            this.currentInput += number;
        }

        // Update operation string based on current state
        if (this.operation) {
            this.operationString = `${this.previousInput} ${this.operation} ${this.currentInput}`;
        } else {
            this.operationString = this.currentInput;
        }

        console.log("After appendNumber:", {
            currentInput: this.currentInput,
            previousInput: this.previousInput,
            operation: this.operation,
            operationString: this.operationString
        });

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
        if (this.currentInput === "") return;

        if (this.operation && this.previousInput && !this.isResultDisplayed) {
            this.calculate();
        }

        // If we're starting from a displayed result, clear the secondary display
        // and use the result as the start of a new operation
        if (this.isResultDisplayed) {
            this.previousInput = this.currentInput;
            this.operationString = `${this.currentInput} ${op}`;
            this.isResultDisplayed = false;  // Switch back to operation building mode
            this.operatorDisplay.textContent = "";  // Clear the secondary display
        } else {
            this.previousInput = this.currentInput;
            this.operationString = `${this.previousInput} ${op}`;
        }

        this.operation = op;
        this.currentInput = "";

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
     * Performs the calculation
     */
    calculate() {
        if (!this.operation || !this.previousInput || this.currentInput === "") return;

        const fullOperation = `${this.previousInput} ${this.operation} ${this.currentInput}`;

        // Perform calculation
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
            this.operationString = "Error";
        } else {
            this.currentInput = this.formatCalculationResult(result);
            this.operationString = fullOperation;
        }

        this.isResultDisplayed = true;
        this.operationString = fullOperation;
        this.updateOperatorDisplay(fullOperation);
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
            this.currentInput = "Error";
            this.operationString = "Error";
        } else {
            this.operationString = `√(${this.currentInput})`;
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
            // After equals: Show result in main display
            this.display.value = this.formatNumber(this.currentInput);
            // Show full operation in top display
            this.operatorDisplay.textContent = `${this.operationString} =`;
        } else {
            // During input: Show the operation string directly without number formatting
            if (this.operation) {
                // If we have an operation, show the full operation string
                this.display.value = this.operationString;
            } else {
                // If no operation, format the current input as a number
                this.display.value = this.formatNumber(this.currentInput || "0");
            }
            // Keep top display empty during input
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

        // Add this block to handle result state
        if (this.isResultDisplayed) {
            // Clear previous operation display and start fresh
            this.previousInput = "";
            this.operation = null;
            this.operationString = "";
            this.isResultDisplayed = false;
            this.operatorDisplay.textContent = "";
        }

        this.currentInput = (parseFloat(this.currentInput) * -1).toString();
        if (this.operation) {
            this.operationString = `${this.previousInput} ${this.operation} ${this.currentInput}`;
        } else {
            this.operationString = this.currentInput;
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
        this.operationString = "";  // Clear the operation string
        this.updateOperatorDisplay("");
        this.updateDisplay();
    }

    /**
     * Handles number input
     * @param {string} num - The number pressed
     */
    handleNumber(num) {
        console.log("Before handleNumber:", {
            currentInput: this.currentInput,
            previousInput: this.previousInput,
            operation: this.operation,
            operationString: this.operationString
        });

        if (this.isResultDisplayed) {
            // Clear all previous operation state when starting fresh
            this.currentInput = num;
            this.previousInput = "";
            this.operation = null;
            this.isResultDisplayed = false;
            this.operationString = num;
            this.operatorDisplay.textContent = ""; // Clear the secondary display
        } else {
            if (this.currentInput === "0" && num !== ".") {
                this.currentInput = num;
            } else {
                this.currentInput += num;
            }

            if (this.operation) {
                this.operationString = `${this.previousInput} ${this.operation} ${this.currentInput}`;
            } else {
                this.operationString = this.currentInput;
            }
        }

        this.updateDisplay();
    }

    /**
     * Handles deletion of the last entered character
     * If displaying a result, clears the calculator
     * Otherwise removes the last entered digit or operator
     */
    handleDelete() {
        // If showing a result, clear everything
        if (this.isResultDisplayed) {
            this.clear();
            return;
        }

        // If we have an operation in progress
        if (this.operation) {
            // If current input exists, delete from it
            if (this.currentInput) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.operationString = `${this.previousInput} ${this.operation} ${this.currentInput}`;
            } 
            // If current input is empty, remove the operator
            else {
                this.operation = null;
                this.currentInput = this.previousInput;
                this.previousInput = "";
                this.operationString = this.currentInput;
            }
        } 
        // If we're just dealing with currentInput
        else {
            this.currentInput = this.currentInput.slice(0, -1);
            this.operationString = this.currentInput;
        }

        this.updateDisplay();
    }
}

// Change to default export
export default Calculator; 
