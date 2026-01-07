// Web Calculator - JavaScript State Management and Core Functions

// Calculator state object with all necessary properties
const calculatorState = {
    currentNumber: '0',
    previousNumber: null,
    operation: null,
    waitingForNewNumber: false,
    lastResult: null,
    isInitialState: true  // Track if we're in the initial state after clear
};

// Enhanced number formatting function with precision handling and overflow protection
function formatNumber(number) {
    // Handle special cases
    if (!isFinite(number)) {
        return 'Error';
    }

    if (number === 0) {
        return '0';
    }

    // Enhanced overflow protection - check for numbers beyond safe integer range
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
    if (Math.abs(number) > MAX_SAFE_INTEGER) {
        return number.toExponential(6);
    }

    // Handle very large numbers or very small numbers (same as original logic)
    if (Math.abs(number) >= 1e15 || (Math.abs(number) < 1e-6 && number !== 0)) {
        return number.toExponential(6);
    }

    // Round to avoid floating point precision issues (same as original)
    const rounded = Math.round(number * 1e10) / 1e10;
    let resultString = rounded.toString();

    // Enhanced display length protection for very long numbers
    const MAX_DISPLAY_LENGTH = 20; // Generous limit to avoid cutting off normal results
    if (resultString.length > MAX_DISPLAY_LENGTH) {
        // Use scientific notation for extremely long results
        return number.toExponential(6);
    }

    return resultString;
}

// Enhanced display update function with overflow protection
function updateDisplay() {
    const display = document.getElementById('display');
    if (display) {
        let displayValue = calculatorState.currentNumber;

        // Apply formatting if the current number is a calculated result
        // (not during user input to preserve what they're typing)
        if (!calculatorState.waitingForNewNumber &&
            !calculatorState.isInitialState &&
            !isNaN(parseFloat(displayValue)) &&
            displayValue !== 'Error') {

            // Only format if it looks like a calculation result (has many decimal places or is very large)
            const numValue = parseFloat(displayValue);
            if (displayValue.includes('.') && displayValue.split('.')[1].length > 6) {
                displayValue = formatNumber(numValue);
            } else if (Math.abs(numValue) >= 1e10) {
                displayValue = formatNumber(numValue);
            }
        }

        // Final overflow check - if display value is too long, truncate or use scientific notation
        const MAX_DISPLAY_LENGTH = 12;
        if (displayValue.length > MAX_DISPLAY_LENGTH && displayValue !== 'Error') {
            const numValue = parseFloat(displayValue);
            if (!isNaN(numValue)) {
                displayValue = formatNumber(numValue);
            } else {
                // If it's not a number but still too long, truncate
                displayValue = displayValue.substring(0, MAX_DISPLAY_LENGTH);
            }
        }

        display.textContent = displayValue;
    }
}

// Core function to update the display (legacy function name for compatibility)
function updateDisplayLegacy() {
    const display = document.getElementById('display');
    if (display) {
        display.textContent = calculatorState.currentNumber;
    }
}

// Core function to clear calculator state
function clear() {
    calculatorState.currentNumber = '0';
    calculatorState.previousNumber = null;
    calculatorState.operation = null;
    calculatorState.waitingForNewNumber = false;
    calculatorState.lastResult = null;
    calculatorState.isInitialState = true;
    updateDisplay();
}

// State reset function (alias for clear for consistency)
function resetState() {
    clear();
}

// Function to handle number input (digits and decimal point)
function inputNumber(number) {
    // Define input limits for overflow protection
    const MAX_INPUT_LENGTH = 12; // Maximum digits user can input

    // Handle decimal point validation - only allow one decimal point per number
    if (number === '.') {
        // If current number already contains a decimal point, ignore additional ones
        if (calculatorState.currentNumber.includes('.')) {
            return;
        }
        // If we're waiting for a new number and user enters decimal, start with "0."
        if (calculatorState.waitingForNewNumber) {
            calculatorState.currentNumber = '0.';
            calculatorState.waitingForNewNumber = false;
        } else {
            // Check length before adding decimal point
            if (calculatorState.currentNumber.length >= MAX_INPUT_LENGTH) {
                return; // Ignore input if too long
            }
            // Add decimal point to current number
            calculatorState.currentNumber += '.';
        }
    } else {
        // Handle digit input with overflow protection
        let newNumber;

        if (calculatorState.waitingForNewNumber) {
            // Start new number (replace current display)
            newNumber = number;
            calculatorState.waitingForNewNumber = false;
            calculatorState.isInitialState = false;
        } else {
            // Handle input based on current state
            if (calculatorState.isInitialState) {
                // First digit input after clear - replace initial '0'
                newNumber = number;
                calculatorState.isInitialState = false;
            } else {
                // Subsequent digits - check length before appending
                if (calculatorState.currentNumber.length >= MAX_INPUT_LENGTH) {
                    return; // Ignore input if too long
                }
                // Append to build the number
                newNumber = calculatorState.currentNumber + number;
            }
        }

        // Additional validation: check if the resulting number would be too large
        const numericValue = parseFloat(newNumber);
        if (!isNaN(numericValue) && Math.abs(numericValue) > Number.MAX_SAFE_INTEGER) {
            // Don't allow input that would exceed safe integer range
            return;
        }

        calculatorState.currentNumber = newNumber;
    }

    // Update the display
    updateDisplay();
}

// Function to handle operation input (+, -, ×, ÷)
function inputOperation(operation) {
    // If we have a previous number and operation, and we're not waiting for a new number,
    // perform the pending calculation first
    if (calculatorState.previousNumber !== null &&
        calculatorState.operation !== null &&
        !calculatorState.waitingForNewNumber) {
        calculate();
    }

    // Store the current number as the previous number for the next calculation
    calculatorState.previousNumber = calculatorState.currentNumber;

    // Store the selected operation
    calculatorState.operation = operation;

    // Set flag to indicate we're waiting for the next number
    calculatorState.waitingForNewNumber = true;

    // Clear the initial state flag since we're now in an operation
    calculatorState.isInitialState = false;

    // Update display to show current state
    updateDisplay();
}

// Function to perform arithmetic calculations
function calculate() {
    // Check if we have all necessary components for calculation
    if (calculatorState.previousNumber === null || calculatorState.operation === null) {
        return; // Cannot calculate without previous number and operation
    }

    // Convert string numbers to floating point for calculation
    const prev = parseFloat(calculatorState.previousNumber);
    const current = parseFloat(calculatorState.currentNumber);
    let result;

    // Perform the calculation based on the operation
    switch (calculatorState.operation) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '×':
            result = prev * current;
            break;
        case '÷':
            // Handle division by zero
            if (current === 0) {
                calculatorState.currentNumber = 'Error';
                calculatorState.previousNumber = null;
                calculatorState.operation = null;
                calculatorState.waitingForNewNumber = true;
                calculatorState.lastResult = null;
                updateDisplay();
                return;
            }
            result = prev / current;
            break;
        default:
            return; // Unknown operation
    }

    // Handle potential calculation errors (NaN, Infinity)
    if (!isFinite(result)) {
        calculatorState.currentNumber = 'Error';
        calculatorState.previousNumber = null;
        calculatorState.operation = null;
        calculatorState.waitingForNewNumber = true;
        calculatorState.lastResult = null;
        updateDisplay();
        return;
    }

    // Format the result using the enhanced formatting function
    const resultString = formatNumber(result);

    // Update calculator state with the result
    calculatorState.currentNumber = resultString;
    calculatorState.lastResult = resultString;
    calculatorState.previousNumber = null;
    calculatorState.operation = null;
    calculatorState.waitingForNewNumber = true;
    calculatorState.isInitialState = false;

    // Update the display
    updateDisplay();
}

// Function to handle keyboard input
function handleKeyboard(event) {
    // Prevent default behavior for calculator keys
    const key = event.key;

    // Handle number keys (0-9)
    if (key >= '0' && key <= '9') {
        event.preventDefault();
        inputNumber(key);
        return;
    }

    // Handle decimal point
    if (key === '.' || key === ',') {
        event.preventDefault();
        inputNumber('.');
        return;
    }

    // Handle operation keys
    switch (key) {
        case '+':
            event.preventDefault();
            inputOperation('+');
            break;
        case '-':
            event.preventDefault();
            inputOperation('-');
            break;
        case '*':
            event.preventDefault();
            inputOperation('×');
            break;
        case '/':
            event.preventDefault();
            inputOperation('÷');
            break;
        case 'Enter':
        case '=':
            event.preventDefault();
            calculate();
            break;
        case 'Escape':
        case 'c':
        case 'C':
            event.preventDefault();
            clear();
            break;
        case 'Backspace':
            event.preventDefault();
            // Handle backspace by removing last character
            if (calculatorState.currentNumber.length > 1) {
                calculatorState.currentNumber = calculatorState.currentNumber.slice(0, -1);
            } else {
                calculatorState.currentNumber = '0';
                calculatorState.isInitialState = true;
            }
            updateDisplay();
            break;
        default:
            // Ignore other keys
            break;
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Set initial display
    updateDisplay();

    // Add event listener for clear button
    const clearButton = document.querySelector('[data-action="clear"]');
    if (clearButton) {
        clearButton.addEventListener('click', clear);
    }

    // Add event listeners for number buttons (including decimal point)
    const numberButtons = document.querySelectorAll('[data-number]');
    numberButtons.forEach(button => {
        button.addEventListener('click', function () {
            const number = this.getAttribute('data-number');
            inputNumber(number);
        });
    });

    // Add event listeners for operation buttons
    const operationButtons = document.querySelectorAll('[data-operation]');
    operationButtons.forEach(button => {
        button.addEventListener('click', function () {
            const operation = this.getAttribute('data-operation');
            inputOperation(operation);
        });
    });

    // Add event listener for equals button
    const equalsButton = document.querySelector('[data-action="equals"]');
    if (equalsButton) {
        equalsButton.addEventListener('click', calculate);
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyboard);
});

// Export functions for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculatorState,
        updateDisplay,
        clear,
        resetState,
        inputNumber,
        inputOperation,
        calculate,
        handleKeyboard,
        formatNumber
    };
}