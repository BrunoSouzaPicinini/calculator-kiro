# Design Document: Web Calculator

## Overview

The web calculator is a single-page application built with vanilla HTML, CSS, and JavaScript. It provides a clean, intuitive interface for performing basic arithmetic operations. The design emphasizes simplicity, accessibility, and responsive behavior across different devices.

The calculator follows a traditional layout with a display area at the top and a button grid below. The architecture separates concerns between presentation (HTML/CSS), behavior (JavaScript), and state management to ensure maintainability and testability.

## Architecture

The application follows a simple Model-View-Controller (MVC) pattern:

- **Model**: Calculator state object that tracks current number, previous number, operation, and display value
- **View**: HTML elements and CSS styling that present the interface
- **Controller**: JavaScript event handlers and calculation logic that manage user interactions

### File Structure
```
/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
└── calculator.js       # JavaScript logic and state management
```

## Components and Interfaces

### HTML Structure

The calculator uses semantic HTML with a container-based layout:

```html
<div class="calculator">
  <div class="display" id="display">0</div>
  <div class="buttons">
    <!-- Number buttons (0-9) -->
    <!-- Operation buttons (+, -, ×, ÷) -->
    <!-- Function buttons (=, C, .) -->
  </div>
</div>
```

### CSS Architecture

The styling uses CSS Grid for the button layout and Flexbox for overall positioning:

- **Grid Layout**: 4×5 button grid with responsive sizing
- **CSS Custom Properties**: For consistent theming and easy maintenance
- **Media Queries**: For responsive behavior across screen sizes
- **Button States**: Hover, active, and focus states for accessibility

### JavaScript Modules

**Calculator State Object**:
```javascript
const calculatorState = {
  currentNumber: '0',
  previousNumber: null,
  operation: null,
  waitingForNewNumber: false,
  lastResult: null
}
```

**Core Functions**:
- `updateDisplay()`: Updates the visual display
- `inputNumber(number)`: Handles number input
- `inputOperation(operation)`: Handles operation selection
- `calculate()`: Performs arithmetic calculations
- `clear()`: Resets calculator state
- `handleKeyboard(event)`: Processes keyboard input

## Data Models

### Calculator State

The calculator maintains a single state object that tracks:

- **currentNumber**: String representation of the number being entered or displayed
- **previousNumber**: String representation of the first operand in a calculation
- **operation**: Current arithmetic operation (+, -, ×, ÷)
- **waitingForNewNumber**: Boolean flag indicating if the next digit starts a new number
- **lastResult**: Stores the result of the last calculation for chaining operations

### Button Configuration

Buttons are categorized by type using data attributes:

```javascript
const buttonTypes = {
  number: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'],
  operation: ['+', '-', '×', '÷'],
  function: ['=', 'C']
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 1.1 and 3.1 both test number display behavior - can be combined into a comprehensive number input property
- Properties 1.2 and 3.2 both test operation state management - can be combined
- Properties 5.1-5.5 test keyboard equivalence - can be combined into input method equivalence properties
- UI structure properties (2.1-2.5) can be combined into a single UI completeness property

### Core Properties

**Property 1: Number Input Display Consistency**
*For any* sequence of valid number button clicks, the display should show the exact concatenation of those digits in the correct order
**Validates: Requirements 1.1, 3.1**

**Property 2: Operation State Management**
*For any* valid arithmetic operation selection, the calculator should correctly store the operation and prepare for the next number input
**Validates: Requirements 1.2, 3.2**

**Property 3: Calculation Correctness**
*For any* valid arithmetic expression with two operands and one operation, the calculator should produce the mathematically correct result
**Validates: Requirements 1.3, 1.5, 3.3**

**Property 4: Clear Function Reset**
*For any* calculator state, pressing the clear button should reset the display to "0" and clear all stored values
**Validates: Requirements 3.4**

**Property 5: Decimal Point Validation**
*For any* number input containing multiple decimal points, only the first decimal point should be accepted and additional ones ignored
**Validates: Requirements 4.1**

**Property 6: Operation Precedence**
*For any* sequence of consecutive operation button clicks, only the most recently selected operation should be stored
**Validates: Requirements 4.2**

**Property 7: Keyboard-Mouse Input Equivalence**
*For any* valid input (numbers, operations, functions), keyboard input should produce identical results to mouse button clicks
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

**Property 8: Number Formatting Consistency**
*For any* calculated result, the display should format numbers with appropriate precision and handle large numbers gracefully
**Validates: Requirements 3.5**

**Property 9: Responsive Layout Preservation**
*For any* viewport size change, the calculator should maintain functional button layout and readable display
**Validates: Requirements 6.4**

<function_calls>
<invoke name="prework">
<parameter name="featureName">web-calculator

## Error Handling

The calculator implements graceful error handling for common edge cases:

### Division by Zero
When a user attempts to divide by zero, the calculator displays "Error" and resets to a clean state. This prevents undefined behavior and provides clear feedback.

### Number Overflow
For calculations that exceed JavaScript's safe integer range (Number.MAX_SAFE_INTEGER), the calculator either:
- Displays the result in scientific notation for very large numbers
- Shows "Error" for infinite or NaN results

### Invalid Input Sequences
The calculator handles invalid input patterns gracefully:
- Multiple decimal points in one number (ignores additional points)
- Operations without operands (treats as no-op or uses previous result)
- Equals without complete expression (displays current number)

### Keyboard Input Validation
All keyboard inputs are validated against allowed characters before processing. Invalid keys are ignored without affecting calculator state.

## Testing Strategy

The testing approach combines unit tests for specific behaviors with property-based tests for comprehensive coverage.

### Unit Testing
Unit tests focus on:
- **Specific Examples**: Test known input-output pairs (e.g., "2 + 3 = 5")
- **Edge Cases**: Division by zero, empty inputs, very large numbers
- **UI Integration**: Button clicks trigger correct functions
- **Error Conditions**: Invalid inputs handled gracefully

### Property-Based Testing
Property-based tests verify universal behaviors using the **fast-check** library for JavaScript:
- **Minimum 100 iterations** per property test for thorough coverage
- **Random input generation** for numbers, operations, and sequences
- **Invariant verification** across all valid input combinations

Each property test is tagged with: **Feature: web-calculator, Property {number}: {property_text}**

### Test Configuration
```javascript
// Example property test structure
fc.test(fc.property(
  fc.array(fc.integer(0, 9), {minLength: 1, maxLength: 10}),
  (digits) => {
    // Test Property 1: Number Input Display Consistency
    // Feature: web-calculator, Property 1: Number Input Display Consistency
  }
), {numRuns: 100});
```

### Testing Framework
- **Unit Tests**: Jest for JavaScript unit testing
- **Property Tests**: fast-check for property-based testing
- **DOM Testing**: jsdom for testing DOM interactions
- **Coverage**: Aim for 90%+ code coverage with emphasis on critical calculation logic

The dual testing approach ensures both correctness of specific scenarios and robustness across the entire input space.