/**
 * Accessibility Utilities for rayy
 * Ensures WCAG 2.1 AA compliance
 */

/**
 * Check color contrast ratio
 * Ensures text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within a modal/dialog
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      const closeButton = element.querySelector('[data-close-modal]');
      if (closeButton) closeButton.click();
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Generate unique ID for aria-labels
 */
let idCounter = 0;
export const generateId = (prefix = 'id') => {
  return `${prefix}-${++idCounter}-${Date.now()}`;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Ensure minimum touch target size (44x44px for mobile)
 */
export const ensureTouchTarget = (element) => {
  const rect = element.getBoundingClientRect();
  const minSize = 44;
  
  if (rect.width < minSize || rect.height < minSize) {
    console.warn('Touch target too small:', element, `${rect.width}x${rect.height}px`);
  }
};

/**
 * Add skip link for keyboard navigation
 */
export const addSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.style.cssText = `
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    background: #3B82F6;
    color: white;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 0 0 4px 4px;
    font-weight: 600;
    z-index: 9999;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.left = '0';
    skipLink.style.width = 'auto';
    skipLink.style.height = 'auto';
    skipLink.style.overflow = 'visible';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.left = '-10000px';
    skipLink.style.width = '1px';
    skipLink.style.height = '1px';
    skipLink.style.overflow = 'hidden';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

/**
 * Validate form field accessibility
 */
export const validateFormAccessibility = (formElement) => {
  const issues = [];
  
  // Check all inputs have labels
  const inputs = formElement.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const label = formElement.querySelector(`label[for="${id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Input missing label: ${input.name || input.type}`);
    }
  });
  
  // Check error messages are associated
  const errors = formElement.querySelectorAll('[role="alert"], .error-message');
  errors.forEach(error => {
    if (!error.getAttribute('id')) {
      issues.push('Error message missing ID for aria-describedby');
    }
  });
  
  if (issues.length > 0) {
    console.warn('Form accessibility issues:', issues);
  }
  
  return issues;
};

/**
 * ARIA live region helper
 */
export const createLiveRegion = (priority = 'polite') => {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  
  return {
    announce: (message) => {
      region.textContent = message;
    },
    clear: () => {
      region.textContent = '';
    },
    remove: () => {
      document.body.removeChild(region);
    }
  };
};

/**
 * Keyboard navigation helper
 */
export const handleKeyboardNav = (elements, currentIndex, key) => {
  let newIndex = currentIndex;
  
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      newIndex = (currentIndex + 1) % elements.length;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      newIndex = (currentIndex - 1 + elements.length) % elements.length;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = elements.length - 1;
      break;
    default:
      return currentIndex;
  }
  
  elements[newIndex]?.focus();
  return newIndex;
};

export default {
  getContrastRatio,
  announceToScreenReader,
  trapFocus,
  generateId,
  prefersReducedMotion,
  ensureTouchTarget,
  addSkipLink,
  validateFormAccessibility,
  createLiveRegion,
  handleKeyboardNav
};
