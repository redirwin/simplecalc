# Simple Calculator Chrome Extension

A lightweight, efficient calculator extension for Chrome that provides essential mathematical operations with a clean, modern interface.

## Features

- Basic arithmetic operations (+, -, ×, ÷)
- Advanced functions:
  - Square root (√)
  - Square (x²)
  - Sign toggle (+/-)
  - History tracking
- Comprehensive percentage calculations
- Support for parentheses and order of operations
- Keyboard support
- Error handling and input validation
- Responsive design with visual feedback
- Maximum 15-digit number input with scientific notation
- Intelligent display handling for long expressions:
  - Main display shows current calculation with horizontal scrolling
  - Secondary display appears automatically for overflow expressions
  - Maintains visibility of current input
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
  - Basic operators:
    - Addition (+)
    - Subtraction (-)
    - Multiplication (*)
    - Division (/)
    - Percentage (%)
  - Advanced functions:
    - Square root (r)
    - Square (s)
    - Sign toggle (!)
  - Input controls:
    - Open parenthesis (()
    - Close parenthesis ())
    - Decimal point (.)
    - Calculate (Enter or =)
    - Clear (Escape)
    - Delete (Backspace or Delete)

### Display Features
- Main display with automatic horizontal scrolling
- Secondary display appears automatically for overflow expressions
- Comma-separated numbers for better readability
- Scientific notation for very large or small numbers
- Visual feedback for digit limit (15 digits maximum)

### History Feature
- Access calculation history with the "H" button
- Click any history entry to restore the calculation
- Clear history with one click
- Persists between sessions
- Stores up to 100 recent calculations

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

## Keyboard Shortcuts

The calculator supports comprehensive keyboard input:

### Number Input
- Main keyboard numbers (0-9)
- Numpad numbers (0-9)

### Basic Operators
- Addition: + (main keyboard or numpad)
- Subtraction: - (main keyboard or numpad)
- Multiplication: * (main keyboard or numpad)
- Division: / (main keyboard or numpad)

### Special Functions
- Square root: R
- Square: S
- Sign toggle: !
- History panel: H
- Percentage: %
- Parentheses: ( and )

### Control Keys
- Calculate: Enter, =, numpad Enter, or numpad =
- Clear: C, NumLock, Clear, or numpad Delete
- Delete: Backspace or main keyboard Delete
- Decimal point: . (main keyboard or numpad)

### Navigation
- Tab: Move between calculator buttons
- Space: Activate focused button

Note: The calculator supports both main keyboard and number pad input for numbers, operators, and basic controls. All keyboard shortcuts work regardless of keyboard focus position, except Space which activates the currently focused button.

## Upcoming Features

### Theme Options
- Light/Dark mode toggle
- Custom color schemes
- High contrast mode for accessibility
- Saved theme preferences

### Custom Keyboard Mappings
- User-configurable keyboard shortcuts
- Import/Export keyboard mapping configurations
- Multiple keyboard layout support
- Conflict detection for custom mappings
- Default mapping presets (Windows Calculator, Mac Calculator, etc.)

Note: These features are under development. The current version uses default keyboard mappings as documented in the Keyboard Shortcuts section above.
