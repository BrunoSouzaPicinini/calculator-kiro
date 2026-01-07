// Test setup for jsdom environment
// Mock CSS properties and viewport for responsive testing

// Mock CSS custom properties
Object.defineProperty(window, 'getComputedStyle', {
    value: (element) => {
        return {
            getPropertyValue: (prop) => {
                // Mock CSS custom property values for different viewport sizes
                const mockValues = {
                    '--calculator-width': '320px',
                    '--button-size': '70px',
                    '--button-gap': '8px',
                    '--display-height': '80px'
                };
                return mockValues[prop] || '';
            }
        };
    }
});

// Mock viewport dimensions
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768
});

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock getBoundingClientRect for layout testing
Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 70,
    height: 70,
    top: 0,
    left: 0,
    bottom: 70,
    right: 70,
    x: 0,
    y: 0
}));