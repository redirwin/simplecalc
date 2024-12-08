# Simple Calculator Chrome Extension

A lightweight, efficient calculator extension for Chrome that provides essential mathematical operations with a clean, modern interface.

## Features

- Basic arithmetic operations (+, -, ×, ÷)
- Advanced functions (square root, square, sign toggle)
- Comprehensive percentage calculations
- Support for parentheses and order of operations
- Keyboard support
- Error handling and input validation
- Responsive design with visual feedback
- Maximum 15-digit display with scientific notation
- Works offline

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

- Click the extension icon in Chrome to open the calculator
- Use mouse or keyboard for input
- Chain multiple operations using the result of previous calculations
- Supports keyboard shortcuts:
  - Numbers (0-9)
  - Operators (+, -, *, /, %)
  - Parentheses ( )
  - Enter/= for calculation
  - Escape for clear
  - Decimal point (.)

### Order of Operations

The calculator follows standard mathematical order of operations (PEMDAS):
1. Parentheses first
2. Exponents (squares and square roots)
3. Multiplication and Division (left to right)
4. Addition and Subtraction (left to right)

Example: 2×(3+4) = 14 (adds 3+4 first, then multiplies by 2)

### Percentage Calculations

The calculator supports various percentage operations for common real-world scenarios:

1. Direct Percentage: Calculate portion of a value
   - Example: 20%12 = 2.4 (calculating a 20% tip on a $12 bill)

2. Addition with Percentage: Add percentage to base value
   - Example: 100+10% = 110 (adding 10% sales tax to a $100 purchase)

3. Subtraction with Percentage: Subtract percentage from base value
   - Example: 100-10% = 90 (applying a 10% discount to a $100 item)

4. Multiplication with Percentage: Direct percentage calculation
   - Example: 100×5% = 5 (calculating monthly interest on a $100 loan at 5% APR)

5. Division with Percentage: Find base value from percentage
   - Example: 200÷10% = 2000 (finding total sales when $200 represents a 10% commission)

6. Complex Operations: Chain percentage calculations
   - Example: 100+10%×2 = 120 (adding 10% tip and doubling for split bill)

## Technical Details

Built using vanilla JavaScript with ES6 modules and follows Chrome Extension Manifest V3 guidelines. The calculator features a modular design with separate concerns for calculations, display formatting, and user input handling.
