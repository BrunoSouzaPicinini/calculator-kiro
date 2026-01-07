const fc = require('fast-check');

// Import calculator functions for testing
const { calculatorState, updateDisplay, clear, resetState, inputNumber, inputOperation, calculate, handleKeyboard, formatNumber } = require('./calculator.js');

// Mock DOM setup for testing
document.body.innerHTML = `
  <main class="calculator-container">
    <div class="calculator">
      <div class="display" id="display" role="textbox" aria-label="Calculator display" aria-readonly="true">0</div>
      <div class="buttons" role="grid" aria-label="Calculator buttons">
        <button class="btn btn-function" data-action="clear" aria-label="Clear">C</button>
        <button class="btn btn-operation" data-operation="÷" aria-label="Divide">÷</button>
        <button class="btn btn-operation" data-operation="×" aria-label="Multiply">×</button>
        <button class="btn btn-operation" data-operation="-" aria-label="Subtract">-</button>
        <button class="btn btn-number" data-number="7" aria-label="Seven">7</button>
        <button class="btn btn-number" data-number="8" aria-label="Eight">8</button>
        <button class="btn btn-number" data-number="9" aria-label="Nine">9</button>
        <button class="btn btn-operation" data-operation="+" aria-label="Add" rowspan="2">+</button>
        <button class="btn btn-number" data-number="4" aria-label="Four">4</button>
        <button class="btn btn-number" data-number="5" aria-label="Five">5</button>
        <button class="btn btn-number" data-number="6" aria-label="Six">6</button>
        <button class="btn btn-number" data-number="1" aria-label="One">1</button>
        <button class="btn btn-number" data-number="2" aria-label="Two">2</button>
        <button class="btn btn-number" data-number="3" aria-label="Three">3</button>
        <button class="btn btn-function" data-action="equals" aria-label="Equals" rowspan="2">=</button>
        <button class="btn btn-number" data-number="0" aria-label="Zero" colspan="2">0</button>
        <button class="btn btn-number" data-number="." aria-label="Decimal point">.</button>
      </div>
    </div>
  </main>
`;

describe('Web Calculator State Management Tests', () => {

    beforeEach(() => {
        // Reset calculator state before each test
        clear();
    });

    // Property 1: Number Input Display Consistency
    // Feature: web-calculator, Property 1: Number Input Display Consistency
    test('Property 1: Number Input Display Consistency', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 10 }),
                (digits) => {
                    // Reset calculator state
                    clear();

                    // Convert digits to strings and input them sequentially
                    const digitStrings = digits.map(d => d.toString());
                    digitStrings.forEach(digit => {
                        inputNumber(digit);
                    });

                    // Expected display should be the concatenation of all digits
                    const expectedDisplay = digitStrings.join('');

                    // Verify the display shows the exact concatenation
                    expect(calculatorState.currentNumber).toBe(expectedDisplay);

                    // Verify the DOM display is updated correctly
                    const display = document.getElementById('display');
                    expect(display.textContent).toBe(expectedDisplay);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 5: Decimal Point Validation
    // Feature: web-calculator, Property 5: Decimal Point Validation
    test('Property 5: Decimal Point Validation', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 0, maxLength: 5 }), // digits before decimal
                fc.integer({ min: 2, max: 5 }), // number of decimal point attempts
                fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 0, maxLength: 5 }), // digits after first decimal
                (digitsBefore, decimalAttempts, digitsAfter) => {
                    // Reset calculator state
                    clear();

                    // Input digits before decimal point
                    digitsBefore.forEach(digit => {
                        inputNumber(digit.toString());
                    });

                    // Input first decimal point
                    inputNumber('.');

                    // Input some digits after first decimal
                    digitsAfter.forEach(digit => {
                        inputNumber(digit.toString());
                    });

                    // Attempt to input additional decimal points (should be ignored)
                    for (let i = 1; i < decimalAttempts; i++) {
                        inputNumber('.');
                    }

                    // Verify only one decimal point exists in the current number
                    const decimalCount = (calculatorState.currentNumber.match(/\./g) || []).length;
                    expect(decimalCount).toBeLessThanOrEqual(1);

                    // Verify the display matches the state
                    const display = document.getElementById('display');
                    expect(display.textContent).toBe(calculatorState.currentNumber);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 4: Clear Function Reset
    // Feature: web-calculator, Property 4: Clear Function Reset
    test('Property 4: Clear Function Reset', () => {
        fc.assert(
            fc.property(
                fc.record({
                    currentNumber: fc.string({ minLength: 1, maxLength: 15 }).filter(s => s !== '0'),
                    previousNumber: fc.option(fc.string({ minLength: 1, maxLength: 15 }), { nil: null }),
                    operation: fc.option(fc.constantFrom('+', '-', '×', '÷'), { nil: null }),
                    waitingForNewNumber: fc.boolean(),
                    lastResult: fc.option(fc.string({ minLength: 1, maxLength: 15 }), { nil: null })
                }),
                (initialState) => {
                    // Set calculator to some arbitrary state
                    calculatorState.currentNumber = initialState.currentNumber;
                    calculatorState.previousNumber = initialState.previousNumber;
                    calculatorState.operation = initialState.operation;
                    calculatorState.waitingForNewNumber = initialState.waitingForNewNumber;
                    calculatorState.lastResult = initialState.lastResult;

                    // Call clear function
                    clear();

                    // Verify all state properties are reset to initial values
                    expect(calculatorState.currentNumber).toBe('0');
                    expect(calculatorState.previousNumber).toBe(null);
                    expect(calculatorState.operation).toBe(null);
                    expect(calculatorState.waitingForNewNumber).toBe(false);
                    expect(calculatorState.lastResult).toBe(null);

                    // Verify display is updated to show "0"
                    const display = document.getElementById('display');
                    expect(display.textContent).toBe('0');

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 2: Operation State Management
    // Feature: web-calculator, Property 2: Operation State Management
    test('Property 2: Operation State Management', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => !isNaN(parseFloat(s))), // valid number string
                fc.constantFrom('+', '-', '×', '÷'), // valid operation
                (numberString, operation) => {
                    // Reset calculator state
                    clear();

                    // Set current number to the test number
                    calculatorState.currentNumber = numberString;

                    // Call inputOperation with the test operation
                    inputOperation(operation);

                    // Verify operation state management
                    expect(calculatorState.previousNumber).toBe(numberString); // Previous number should be stored
                    expect(calculatorState.operation).toBe(operation); // Operation should be stored
                    expect(calculatorState.waitingForNewNumber).toBe(true); // Should be waiting for next number
                    expect(calculatorState.isInitialState).toBe(false); // Should not be in initial state

                    // Verify display still shows the original number (operation doesn't change display immediately)
                    expect(calculatorState.currentNumber).toBe(numberString);
                    const display = document.getElementById('display');
                    expect(display.textContent).toBe(numberString);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 3: Calculation Correctness
    // Feature: web-calculator, Property 3: Calculation Correctness
    test('Property 3: Calculation Correctness', () => {
        fc.assert(
            fc.property(
                fc.float({ min: -1000, max: 1000, noNaN: true }).filter(n => isFinite(n)), // first operand
                fc.float({ min: -1000, max: 1000, noNaN: true }).filter(n => isFinite(n) && n !== 0), // second operand (non-zero for division)
                fc.constantFrom('+', '-', '×', '÷'), // operation
                (num1, num2, operation) => {
                    // Reset calculator state
                    clear();

                    // Set up the calculation state
                    calculatorState.previousNumber = num1.toString();
                    calculatorState.currentNumber = num2.toString();
                    calculatorState.operation = operation;

                    // Perform the calculation
                    calculate();

                    // Calculate expected result
                    let expectedResult;
                    switch (operation) {
                        case '+':
                            expectedResult = num1 + num2;
                            break;
                        case '-':
                            expectedResult = num1 - num2;
                            break;
                        case '×':
                            expectedResult = num1 * num2;
                            break;
                        case '÷':
                            expectedResult = num1 / num2;
                            break;
                    }

                    // Handle precision and formatting like the calculator does
                    let expectedString = expectedResult.toString();
                    if (Math.abs(expectedResult) >= 1e15 || (Math.abs(expectedResult) < 1e-6 && expectedResult !== 0)) {
                        expectedString = expectedResult.toExponential(6);
                    } else {
                        expectedResult = Math.round(expectedResult * 1e10) / 1e10;
                        expectedString = expectedResult.toString();
                    }

                    // Verify the calculation result matches expected
                    expect(calculatorState.currentNumber).toBe(expectedString);

                    // Verify state is properly reset after calculation
                    expect(calculatorState.previousNumber).toBe(null);
                    expect(calculatorState.operation).toBe(null);
                    expect(calculatorState.waitingForNewNumber).toBe(true);
                    expect(calculatorState.lastResult).toBe(expectedString);

                    // Verify display is updated
                    const display = document.getElementById('display');
                    expect(display.textContent).toBe(expectedString);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 6: Operation Precedence
    // Feature: web-calculator, Property 6: Operation Precedence
    test('Property 6: Operation Precedence', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => !isNaN(parseFloat(s))), // valid number string
                fc.array(fc.constantFrom('+', '-', '×', '÷'), { minLength: 2, maxLength: 5 }), // sequence of operations
                (numberString, operations) => {
                    // Reset calculator state
                    clear();

                    // Set current number to the test number
                    calculatorState.currentNumber = numberString;

                    // Input the sequence of operations consecutively
                    operations.forEach(operation => {
                        inputOperation(operation);
                    });

                    // Verify only the most recent operation is stored
                    const lastOperation = operations[operations.length - 1];
                    expect(calculatorState.operation).toBe(lastOperation);

                    // Verify the previous number is still stored correctly
                    expect(calculatorState.previousNumber).toBe(numberString);

                    // Verify we're waiting for a new number
                    expect(calculatorState.waitingForNewNumber).toBe(true);

                    // Verify display still shows the original number
                    expect(calculatorState.currentNumber).toBe(numberString);
                    const display = document.getElementById('display');
                    expect(display.textContent).toBe(numberString);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit test for clear function
    test('Clear function resets display to zero', () => {
        // Set some state
        calculatorState.currentNumber = '123.45';
        calculatorState.previousNumber = '67.89';
        calculatorState.operation = '+';
        calculatorState.waitingForNewNumber = true;
        calculatorState.lastResult = '191.34';

        // Call clear
        clear();

        // Verify state is reset
        expect(calculatorState.currentNumber).toBe('0');
        expect(calculatorState.previousNumber).toBe(null);
        expect(calculatorState.operation).toBe(null);
        expect(calculatorState.waitingForNewNumber).toBe(false);
        expect(calculatorState.lastResult).toBe(null);

        // Verify display shows "0"
        const display = document.getElementById('display');
        expect(display.textContent).toBe('0');
    });

    test('resetState function works identically to clear', () => {
        // Set some state
        calculatorState.currentNumber = '999';
        calculatorState.previousNumber = '111';
        calculatorState.operation = '×';
        calculatorState.waitingForNewNumber = true;
        calculatorState.lastResult = '110889';

        // Call resetState
        resetState();

        // Verify state is reset (same as clear)
        expect(calculatorState.currentNumber).toBe('0');
        expect(calculatorState.previousNumber).toBe(null);
        expect(calculatorState.operation).toBe(null);
        expect(calculatorState.waitingForNewNumber).toBe(false);
        expect(calculatorState.lastResult).toBe(null);
    });

    // Property 7: Keyboard-Mouse Input Equivalence
    // Feature: web-calculator, Property 7: Keyboard-Mouse Input Equivalence
    test('Property 7: Keyboard-Mouse Input Equivalence', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    // Number inputs (0-9)
                    fc.record({
                        type: fc.constant('number'),
                        value: fc.integer({ min: 0, max: 9 }).map(n => n.toString())
                    }),
                    // Decimal point
                    fc.record({
                        type: fc.constant('decimal'),
                        value: fc.constant('.')
                    }),
                    // Operations
                    fc.record({
                        type: fc.constant('operation'),
                        value: fc.constantFrom('+', '-', '×', '÷')
                    }),
                    // Functions
                    fc.record({
                        type: fc.constant('function'),
                        value: fc.constantFrom('clear', 'equals')
                    })
                ),
                (input) => {
                    // Reset calculator state for both tests
                    clear();
                    const initialState = JSON.parse(JSON.stringify(calculatorState));

                    // Test mouse input (button click simulation)
                    if (input.type === 'number' || input.type === 'decimal') {
                        inputNumber(input.value);
                    } else if (input.type === 'operation') {
                        inputOperation(input.value);
                    } else if (input.type === 'function') {
                        if (input.value === 'clear') {
                            clear();
                        } else if (input.value === 'equals') {
                            calculate();
                        }
                    }

                    // Capture state after mouse input
                    const mouseState = JSON.parse(JSON.stringify(calculatorState));
                    const mouseDisplay = document.getElementById('display').textContent;

                    // Reset calculator state for keyboard test
                    Object.assign(calculatorState, initialState);
                    updateDisplay();

                    // Test keyboard input (simulate keyboard event)
                    let keyboardKey;
                    if (input.type === 'number' || input.type === 'decimal') {
                        keyboardKey = input.value;
                    } else if (input.type === 'operation') {
                        // Map operations to keyboard keys
                        const operationKeyMap = {
                            '+': '+',
                            '-': '-',
                            '×': '*',
                            '÷': '/'
                        };
                        keyboardKey = operationKeyMap[input.value];
                    } else if (input.type === 'function') {
                        if (input.value === 'clear') {
                            keyboardKey = 'Escape';
                        } else if (input.value === 'equals') {
                            keyboardKey = 'Enter';
                        }
                    }

                    // Create mock keyboard event
                    const mockEvent = {
                        key: keyboardKey,
                        preventDefault: jest.fn()
                    };

                    // Call keyboard handler
                    handleKeyboard(mockEvent);

                    // Capture state after keyboard input
                    const keyboardState = JSON.parse(JSON.stringify(calculatorState));
                    const keyboardDisplay = document.getElementById('display').textContent;

                    // Verify keyboard and mouse inputs produce identical results
                    expect(keyboardState.currentNumber).toBe(mouseState.currentNumber);
                    expect(keyboardState.previousNumber).toBe(mouseState.previousNumber);
                    expect(keyboardState.operation).toBe(mouseState.operation);
                    expect(keyboardState.waitingForNewNumber).toBe(mouseState.waitingForNewNumber);
                    expect(keyboardState.lastResult).toBe(mouseState.lastResult);
                    expect(keyboardState.isInitialState).toBe(mouseState.isInitialState);

                    // Verify display shows the same result
                    expect(keyboardDisplay).toBe(mouseDisplay);

                    // Verify preventDefault was called for keyboard input
                    expect(mockEvent.preventDefault).toHaveBeenCalled();

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 8: Number Formatting Consistency
    // Feature: web-calculator, Property 8: Number Formatting Consistency
    test('Property 8: Number Formatting Consistency', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    // Normal range numbers
                    fc.float({ min: Math.fround(-1e6), max: Math.fround(1e6), noNaN: true }).filter(n => isFinite(n)),
                    // Large integers scaled up
                    fc.integer({ min: -1000, max: 1000 }).map(n => n * 1e12),
                    // Small numbers
                    fc.integer({ min: -1000, max: 1000 }).map(n => n * 1e-8),
                    // Edge cases
                    fc.constantFrom(0, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, 1e-7, -1e-7)
                ),
                (number) => {
                    // Test the formatNumber function directly
                    const formatted = formatNumber(number);

                    // Verify the result is always a string
                    expect(typeof formatted).toBe('string');

                    // Verify the result is not empty
                    expect(formatted.length).toBeGreaterThan(0);

                    // Verify special cases are handled correctly
                    if (!isFinite(number)) {
                        expect(formatted).toBe('Error');
                        return true;
                    }

                    if (number === 0) {
                        expect(formatted).toBe('0');
                        return true;
                    }

                    // For very large numbers, should use scientific notation
                    if (Math.abs(number) >= 1e15) {
                        expect(formatted).toMatch(/^-?\d\.\d+e[+-]\d+$/);
                        return true;
                    }

                    // For very small numbers (close to zero), should use scientific notation
                    if (Math.abs(number) < 1e-6 && number !== 0) {
                        expect(formatted).toMatch(/^-?\d\.\d+e[+-]\d+$/);
                        return true;
                    }

                    // For numbers beyond safe integer range, should use scientific notation
                    if (Math.abs(number) > Number.MAX_SAFE_INTEGER) {
                        expect(formatted).toMatch(/^-?\d\.\d+e[+-]\d+$/);
                        return true;
                    }

                    // For normal range numbers, should be a regular decimal or integer
                    expect(formatted).toMatch(/^-?\d+(\.\d+)?$/);

                    // Verify the formatted result doesn't exceed reasonable display length
                    expect(formatted.length).toBeLessThanOrEqual(20);

                    // Verify that parsing the formatted result gives a number close to the original
                    const parsed = parseFloat(formatted);
                    expect(isFinite(parsed)).toBe(true);

                    // Allow for some precision loss due to rounding
                    const tolerance = Math.abs(number) * 1e-9 + 1e-10;
                    expect(Math.abs(parsed - number)).toBeLessThanOrEqual(tolerance);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Web Calculator Responsive Layout Tests', () => {

    // Property 9: Responsive Layout Preservation
    // Feature: web-calculator, Property 9: Responsive Layout Preservation
    test('Property 9: Responsive Layout Preservation', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 1920 }), // viewport widths
                fc.integer({ min: 568, max: 1080 }), // viewport heights
                (viewportWidth, viewportHeight) => {
                    // Mock viewport size change
                    Object.defineProperty(window, 'innerWidth', {
                        writable: true,
                        configurable: true,
                        value: viewportWidth
                    });

                    Object.defineProperty(window, 'innerHeight', {
                        writable: true,
                        configurable: true,
                        value: viewportHeight
                    });

                    // Get calculator elements
                    const calculator = document.querySelector('.calculator');
                    const display = document.querySelector('.display');
                    const buttons = document.querySelectorAll('.btn');
                    const buttonsContainer = document.querySelector('.buttons');

                    // Verify calculator structure exists
                    expect(calculator).toBeTruthy();
                    expect(display).toBeTruthy();
                    expect(buttons.length).toBe(17); // Total number of buttons
                    expect(buttonsContainer).toBeTruthy();

                    // Verify all buttons are accessible (have proper classes and attributes)
                    buttons.forEach(button => {
                        expect(button.classList.contains('btn')).toBe(true);
                        expect(button.textContent.trim().length).toBeGreaterThan(0);

                        // Verify button has proper type classification
                        const hasTypeClass = button.classList.contains('btn-number') ||
                            button.classList.contains('btn-operation') ||
                            button.classList.contains('btn-function');
                        expect(hasTypeClass).toBe(true);
                    });

                    // Verify essential buttons exist
                    const numberButtons = document.querySelectorAll('.btn-number');
                    const operationButtons = document.querySelectorAll('.btn-operation');
                    const functionButtons = document.querySelectorAll('.btn-function');

                    expect(numberButtons.length).toBe(11); // 0-9 and decimal point
                    expect(operationButtons.length).toBe(4); // +, -, ×, ÷
                    expect(functionButtons.length).toBe(2); // C and =

                    // Verify specific critical buttons exist
                    expect(document.querySelector('[data-action="clear"]')).toBeTruthy();
                    expect(document.querySelector('[data-action="equals"]')).toBeTruthy();
                    expect(document.querySelector('[data-number="0"]')).toBeTruthy();
                    expect(document.querySelector('[data-operation="+"]')).toBeTruthy();

                    // For mobile viewports, verify touch-friendly sizing would be applied
                    if (viewportWidth <= 768) {
                        // In a real implementation, we would check computed styles
                        // Here we verify the structure remains intact for mobile
                        expect(buttons.length).toBe(17); // All buttons still present
                        expect(display).toBeTruthy(); // Display still accessible
                    }

                    // Verify layout maintains functional button grid structure
                    // All buttons should be present and have proper data attributes
                    const numbersWithData = Array.from(numberButtons).filter(btn =>
                        btn.hasAttribute('data-number')
                    );
                    const operationsWithData = Array.from(operationButtons).filter(btn =>
                        btn.hasAttribute('data-operation')
                    );
                    const functionsWithData = Array.from(functionButtons).filter(btn =>
                        btn.hasAttribute('data-action')
                    );

                    expect(numbersWithData.length).toBe(11);
                    expect(operationsWithData.length).toBe(4);
                    expect(functionsWithData.length).toBe(2);

                    return true; // Property holds
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit test for UI structure completeness
    test('UI structure completeness', () => {
        // Verify all required elements exist
        expect(document.querySelector('.calculator')).toBeTruthy();
        expect(document.querySelector('.display')).toBeTruthy();
        expect(document.querySelector('.buttons')).toBeTruthy();

        // Verify all required buttons exist with proper attributes
        const requiredButtons = [
            { selector: '[data-number="0"]', text: '0' },
            { selector: '[data-number="1"]', text: '1' },
            { selector: '[data-number="2"]', text: '2' },
            { selector: '[data-number="3"]', text: '3' },
            { selector: '[data-number="4"]', text: '4' },
            { selector: '[data-number="5"]', text: '5' },
            { selector: '[data-number="6"]', text: '6' },
            { selector: '[data-number="7"]', text: '7' },
            { selector: '[data-number="8"]', text: '8' },
            { selector: '[data-number="9"]', text: '9' },
            { selector: '[data-number="."]', text: '.' },
            { selector: '[data-operation="+"]', text: '+' },
            { selector: '[data-operation="-"]', text: '-' },
            { selector: '[data-operation="×"]', text: '×' },
            { selector: '[data-operation="÷"]', text: '÷' },
            { selector: '[data-action="clear"]', text: 'C' },
            { selector: '[data-action="equals"]', text: '=' }
        ];

        requiredButtons.forEach(({ selector, text }) => {
            const button = document.querySelector(selector);
            expect(button).toBeTruthy();
            expect(button.textContent.trim()).toBe(text);
        });
    });

    // Enhanced UI structure and accessibility tests
    test('UI accessibility attributes completeness', () => {
        // Verify display has proper accessibility attributes
        const display = document.querySelector('.display');
        expect(display).toBeTruthy();
        expect(display.getAttribute('role')).toBe('textbox');
        expect(display.getAttribute('aria-label')).toBe('Calculator display');
        expect(display.getAttribute('aria-readonly')).toBe('true');

        // Verify buttons container has proper grid role
        const buttonsContainer = document.querySelector('.buttons');
        expect(buttonsContainer).toBeTruthy();
        expect(buttonsContainer.getAttribute('role')).toBe('grid');
        expect(buttonsContainer.getAttribute('aria-label')).toBe('Calculator buttons');

        // Verify all buttons have proper accessibility labels
        const accessibilityLabels = [
            { selector: '[data-number="0"]', label: 'Zero' },
            { selector: '[data-number="1"]', label: 'One' },
            { selector: '[data-number="2"]', label: 'Two' },
            { selector: '[data-number="3"]', label: 'Three' },
            { selector: '[data-number="4"]', label: 'Four' },
            { selector: '[data-number="5"]', label: 'Five' },
            { selector: '[data-number="6"]', label: 'Six' },
            { selector: '[data-number="7"]', label: 'Seven' },
            { selector: '[data-number="8"]', label: 'Eight' },
            { selector: '[data-number="9"]', label: 'Nine' },
            { selector: '[data-number="."]', label: 'Decimal point' },
            { selector: '[data-operation="+"]', label: 'Add' },
            { selector: '[data-operation="-"]', label: 'Subtract' },
            { selector: '[data-operation="×"]', label: 'Multiply' },
            { selector: '[data-operation="÷"]', label: 'Divide' },
            { selector: '[data-action="clear"]', label: 'Clear' },
            { selector: '[data-action="equals"]', label: 'Equals' }
        ];

        accessibilityLabels.forEach(({ selector, label }) => {
            const button = document.querySelector(selector);
            expect(button).toBeTruthy();
            expect(button.getAttribute('aria-label')).toBe(label);
        });
    });

    // Test CSS class structure completeness
    test('CSS class structure completeness', () => {
        // Verify main container classes
        expect(document.querySelector('.calculator-container')).toBeTruthy();
        expect(document.querySelector('.calculator')).toBeTruthy();

        // Verify display classes
        const display = document.querySelector('.display');
        expect(display).toBeTruthy();
        expect(display.id).toBe('display');

        // Verify button type classes
        const numberButtons = document.querySelectorAll('.btn-number');
        const operationButtons = document.querySelectorAll('.btn-operation');
        const functionButtons = document.querySelectorAll('.btn-function');

        expect(numberButtons.length).toBe(11); // 0-9 and decimal point
        expect(operationButtons.length).toBe(4); // +, -, ×, ÷
        expect(functionButtons.length).toBe(2); // C and =

        // Verify all buttons have base 'btn' class
        const allButtons = document.querySelectorAll('.btn');
        expect(allButtons.length).toBe(17); // Total buttons

        allButtons.forEach(button => {
            expect(button.classList.contains('btn')).toBe(true);

            // Verify each button has exactly one type class
            const typeClasses = ['btn-number', 'btn-operation', 'btn-function'];
            const hasTypeClass = typeClasses.filter(cls => button.classList.contains(cls));
            expect(hasTypeClass.length).toBe(1);
        });
    });

    // Test mobile-specific enhancements
    test('Mobile-specific UI enhancements', () => {
        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375 // iPhone-like width
        });

        // Verify all buttons exist and are accessible on mobile
        const buttons = document.querySelectorAll('.btn');
        expect(buttons.length).toBe(17);

        // Verify critical buttons for mobile usage
        const criticalButtons = [
            '.btn[data-number="0"]',
            '.btn[data-action="clear"]',
            '.btn[data-action="equals"]',
            '.btn[data-operation="+"]'
        ];

        criticalButtons.forEach(selector => {
            const button = document.querySelector(selector);
            expect(button).toBeTruthy();
            expect(button.classList.contains('btn')).toBe(true);
        });

        // Verify display is accessible on mobile
        const display = document.querySelector('.display');
        expect(display).toBeTruthy();
        expect(display.id).toBe('display');

        // Verify grid layout structure is maintained
        const buttonsContainer = document.querySelector('.buttons');
        expect(buttonsContainer).toBeTruthy();
        expect(buttonsContainer.classList.contains('buttons')).toBe(true);
    });

    // Test special button grid positioning
    test('Special button grid positioning', () => {
        // Verify zero button has colspan attribute for spanning 2 columns
        const zeroButton = document.querySelector('[data-number="0"]');
        expect(zeroButton).toBeTruthy();
        expect(zeroButton.getAttribute('colspan')).toBe('2');

        // Verify plus button has rowspan attribute for spanning 2 rows
        const plusButton = document.querySelector('[data-operation="+"]');
        expect(plusButton).toBeTruthy();
        expect(plusButton.getAttribute('rowspan')).toBe('2');

        // Verify equals button has rowspan attribute for spanning 2 rows
        const equalsButton = document.querySelector('[data-action="equals"]');
        expect(equalsButton).toBeTruthy();
        expect(equalsButton.getAttribute('rowspan')).toBe('2');
    });

    // Test semantic HTML structure
    test('Semantic HTML structure', () => {
        // Verify main semantic element
        const main = document.querySelector('main');
        expect(main).toBeTruthy();
        expect(main.classList.contains('calculator-container')).toBe(true);

        // Verify proper nesting structure
        const calculator = main.querySelector('.calculator');
        expect(calculator).toBeTruthy();

        const display = calculator.querySelector('.display');
        expect(display).toBeTruthy();

        const buttons = calculator.querySelector('.buttons');
        expect(buttons).toBeTruthy();

        // Verify all buttons are within the buttons container
        const buttonsInContainer = buttons.querySelectorAll('.btn');
        const allButtons = document.querySelectorAll('.btn');
        expect(buttonsInContainer.length).toBe(allButtons.length);
        expect(buttonsInContainer.length).toBe(17);
    });
});

describe('Web Calculator Integration Tests', () => {

    beforeEach(() => {
        // Reset calculator state before each test
        clear();

        // Ensure DOM is properly set up
        const display = document.getElementById('display');
        if (display) {
            display.textContent = '0';
        }
    });

    // Integration test for complete calculation workflows
    test('End-to-end calculation scenarios', () => {
        // Test 1: Simple addition workflow
        inputNumber('5');
        inputOperation('+');
        inputNumber('3');
        calculate();

        expect(calculatorState.currentNumber).toBe('8');
        expect(document.getElementById('display').textContent).toBe('8');

        // Test 2: Chain calculations (result becomes first operand)
        inputOperation('×');
        inputNumber('2');
        calculate();

        expect(calculatorState.currentNumber).toBe('16');
        expect(document.getElementById('display').textContent).toBe('16');

        // Test 3: Clear and start new calculation
        clear();
        inputNumber('1');
        inputNumber('0');
        inputOperation('-');
        inputNumber('4');
        calculate();

        expect(calculatorState.currentNumber).toBe('6');
        expect(document.getElementById('display').textContent).toBe('6');
    });

    test('Decimal number calculation workflows', () => {
        // Test decimal addition
        inputNumber('1');
        inputNumber('.');
        inputNumber('5');
        inputOperation('+');
        inputNumber('2');
        inputNumber('.');
        inputNumber('3');
        calculate();

        expect(calculatorState.currentNumber).toBe('3.8');
        expect(document.getElementById('display').textContent).toBe('3.8');

        // Test decimal multiplication
        clear();
        inputNumber('0');
        inputNumber('.');
        inputNumber('5');
        inputOperation('×');
        inputNumber('4');
        calculate();

        expect(calculatorState.currentNumber).toBe('2');
        expect(document.getElementById('display').textContent).toBe('2');
    });

    test('Complex calculation sequences', () => {
        // Test: 100 ÷ 4 - 15 + 3 × 2 = 14
        // Step 1: 100 ÷ 4 = 25
        inputNumber('1');
        inputNumber('0');
        inputNumber('0');
        inputOperation('÷');
        inputNumber('4');
        inputOperation('-'); // This triggers calculation of 100÷4

        expect(calculatorState.currentNumber).toBe('25');

        // Step 2: 25 - 15 = 10
        inputNumber('1');
        inputNumber('5');
        inputOperation('+'); // This triggers calculation of 25-15

        expect(calculatorState.currentNumber).toBe('10');

        // Step 3: 10 + 3 = 13
        inputNumber('3');
        inputOperation('×'); // This triggers calculation of 10+3

        expect(calculatorState.currentNumber).toBe('13');

        // Step 4: 13 × 2 = 26
        inputNumber('2');
        calculate();

        expect(calculatorState.currentNumber).toBe('26');
        expect(document.getElementById('display').textContent).toBe('26');
    });

    test('Button click integration workflows', () => {
        // Manually attach event listeners for testing (since DOMContentLoaded doesn't fire in test)
        const clearButton = document.querySelector('[data-action="clear"]');
        const equalsButton = document.querySelector('[data-action="equals"]');
        const numberButtons = document.querySelectorAll('[data-number]');
        const operationButtons = document.querySelectorAll('[data-operation]');

        // Attach event listeners
        if (clearButton) {
            clearButton.addEventListener('click', clear);
        }
        if (equalsButton) {
            equalsButton.addEventListener('click', calculate);
        }
        numberButtons.forEach(button => {
            button.addEventListener('click', function () {
                const number = this.getAttribute('data-number');
                inputNumber(number);
            });
        });
        operationButtons.forEach(button => {
            button.addEventListener('click', function () {
                const operation = this.getAttribute('data-operation');
                inputOperation(operation);
            });
        });

        const buttons = {
            '7': document.querySelector('[data-number="7"]'),
            '×': document.querySelector('[data-operation="×"]'),
            '6': document.querySelector('[data-number="6"]'),
            '=': document.querySelector('[data-action="equals"]'),
            'C': document.querySelector('[data-action="clear"]')
        };

        // Verify all buttons exist
        Object.values(buttons).forEach(button => {
            expect(button).toBeTruthy();
        });

        // Test workflow: 7 × 6 = 42
        buttons['7'].click();
        expect(document.getElementById('display').textContent).toBe('7');

        buttons['×'].click();
        expect(document.getElementById('display').textContent).toBe('7');

        buttons['6'].click();
        expect(document.getElementById('display').textContent).toBe('6');

        buttons['='].click();
        expect(document.getElementById('display').textContent).toBe('42');

        // Test clear button
        buttons['C'].click();
        expect(document.getElementById('display').textContent).toBe('0');
        expect(calculatorState.currentNumber).toBe('0');
        expect(calculatorState.previousNumber).toBe(null);
        expect(calculatorState.operation).toBe(null);
    });

    test('Keyboard input integration workflows', () => {
        // Test complete keyboard workflow: 9 + 1 = 10
        const mockEvents = [
            { key: '9', preventDefault: jest.fn() },
            { key: '+', preventDefault: jest.fn() },
            { key: '1', preventDefault: jest.fn() },
            { key: 'Enter', preventDefault: jest.fn() }
        ];

        mockEvents[0] && handleKeyboard(mockEvents[0]);
        expect(document.getElementById('display').textContent).toBe('9');

        mockEvents[1] && handleKeyboard(mockEvents[1]);
        expect(document.getElementById('display').textContent).toBe('9');

        mockEvents[2] && handleKeyboard(mockEvents[2]);
        expect(document.getElementById('display').textContent).toBe('1');

        mockEvents[3] && handleKeyboard(mockEvents[3]);
        expect(document.getElementById('display').textContent).toBe('10');

        // Verify preventDefault was called for all events
        mockEvents.forEach(event => {
            expect(event.preventDefault).toHaveBeenCalled();
        });

        // Test keyboard clear
        const escapeEvent = { key: 'Escape', preventDefault: jest.fn() };
        handleKeyboard(escapeEvent);
        expect(document.getElementById('display').textContent).toBe('0');
        expect(escapeEvent.preventDefault).toHaveBeenCalled();
    });
});

describe('Web Calculator Error Handling Integration Tests', () => {

    beforeEach(() => {
        clear();
    });

    // Test error handling scenarios - Requirements 1.4, 4.3, 4.4
    test('Division by zero error handling workflow', () => {
        // Test direct division by zero
        inputNumber('5');
        inputOperation('÷');
        inputNumber('0');
        calculate();

        expect(calculatorState.currentNumber).toBe('Error');
        expect(document.getElementById('display').textContent).toBe('Error');
        expect(calculatorState.previousNumber).toBe(null);
        expect(calculatorState.operation).toBe(null);
        expect(calculatorState.waitingForNewNumber).toBe(true);

        // Test that calculator can recover from error state
        clear();
        inputNumber('3');
        inputOperation('+');
        inputNumber('2');
        calculate();

        expect(calculatorState.currentNumber).toBe('5');
        expect(document.getElementById('display').textContent).toBe('5');
    });

    test('Multiple decimal points error handling', () => {
        // Test multiple decimal point rejection
        inputNumber('1');
        inputNumber('.');
        inputNumber('2');
        inputNumber('.'); // Should be ignored
        inputNumber('3');
        inputNumber('.'); // Should be ignored
        inputNumber('4');

        expect(calculatorState.currentNumber).toBe('1.234');
        expect(document.getElementById('display').textContent).toBe('1.234');

        // Verify only one decimal point exists
        const decimalCount = (calculatorState.currentNumber.match(/\./g) || []).length;
        expect(decimalCount).toBe(1);
    });

    test('Incomplete expression handling', () => {
        // Test equals without complete expression
        inputNumber('5');
        inputOperation('+');
        // Don't input second number, just press equals
        calculate();

        // Should handle gracefully - calculator uses current number as second operand
        expect(calculatorState.currentNumber).toBe('10'); // 5 + 5 = 10
        expect(document.getElementById('display').textContent).toBe('10');

        // Test operation without any numbers
        clear();
        inputOperation('+');
        calculate();

        // Should handle gracefully without crashing
        expect(calculatorState.currentNumber).toBe('0');
        expect(document.getElementById('display').textContent).toBe('0');
    });

    test('Large number overflow handling', () => {
        // Test very large number handling
        const largeNumber = '999999999999999';
        largeNumber.split('').forEach(digit => inputNumber(digit));

        inputOperation('×');
        inputNumber('9');
        inputNumber('9');
        inputNumber('9');
        calculate();

        // Should handle large numbers gracefully (scientific notation or error)
        const result = calculatorState.currentNumber;
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        // Result should be either scientific notation or formatted number
        const isScientific = /^-?\d\.\d+e[+-]\d+$/.test(result);
        const isFormattedNumber = /^-?\d+(\.\d+)?$/.test(result);
        const isError = result === 'Error';

        expect(isScientific || isFormattedNumber || isError).toBe(true);
    });

    test('Consecutive operations handling', () => {
        // Test consecutive operation button presses
        inputNumber('5');
        inputOperation('+');
        inputOperation('-');
        inputOperation('×');
        inputOperation('÷');

        // Should store only the last operation
        expect(calculatorState.operation).toBe('÷');
        expect(calculatorState.previousNumber).toBe('5');
        expect(calculatorState.waitingForNewNumber).toBe(true);

        // Complete the calculation
        inputNumber('2');
        calculate();

        expect(calculatorState.currentNumber).toBe('2.5'); // 5 ÷ 2 = 2.5
        expect(document.getElementById('display').textContent).toBe('2.5');
    });

    test('Input length overflow protection', () => {
        // Test maximum input length protection
        const longInput = '123456789012345'; // 15 digits (beyond typical limit)

        longInput.split('').forEach(digit => inputNumber(digit));

        // Should limit input length to prevent overflow
        expect(calculatorState.currentNumber.length).toBeLessThanOrEqual(12);
        expect(document.getElementById('display').textContent.length).toBeLessThanOrEqual(20);

        // Should still be a valid number
        const numValue = parseFloat(calculatorState.currentNumber);
        expect(isNaN(numValue)).toBe(false);
    });

    test('Invalid keyboard input handling', () => {
        // Test invalid keyboard inputs are ignored
        const invalidEvents = [
            { key: 'a', preventDefault: jest.fn() },
            { key: 'Z', preventDefault: jest.fn() },
            { key: '!', preventDefault: jest.fn() },
            { key: 'F1', preventDefault: jest.fn() }
        ];

        const initialState = JSON.parse(JSON.stringify(calculatorState));
        const initialDisplay = document.getElementById('display').textContent;

        invalidEvents.forEach(event => {
            handleKeyboard(event);
        });

        // State should remain unchanged
        expect(calculatorState.currentNumber).toBe(initialState.currentNumber);
        expect(calculatorState.previousNumber).toBe(initialState.previousNumber);
        expect(calculatorState.operation).toBe(initialState.operation);
        expect(document.getElementById('display').textContent).toBe(initialDisplay);

        // preventDefault should not be called for invalid keys
        invalidEvents.forEach(event => {
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });
});