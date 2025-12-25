/**
 * Accessibility Fixer
 * Automatically adds aria-labels to buttons without text
 * Runs after React renders
 */

export const fixAccessibility = () => {
  // Fix buttons without accessible names
  const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
  
  buttons.forEach((button) => {
    // Skip if button has text content
    if (button.textContent.trim()) return;
    
    // Check if button contains only icons/SVGs
    const hasOnlyIcon = button.querySelector('svg') && !button.textContent.trim();
    
    if (hasOnlyIcon) {
      // Try to infer aria-label from context
      const svg = button.querySelector('svg');
      const className = button.className;
      const parent = button.parentElement;
      
      // Common patterns
      if (className.includes('close') || button.innerHTML.includes('×') || button.innerHTML.includes('X')) {
        button.setAttribute('aria-label', 'Close');
      } else if (className.includes('menu') || className.includes('hamburger')) {
        button.setAttribute('aria-label', 'Open menu');
      } else if (className.includes('search')) {
        button.setAttribute('aria-label', 'Search');
      } else if (className.includes('filter')) {
        button.setAttribute('aria-label', 'Toggle filters');
      } else if (className.includes('favorite') || className.includes('like')) {
        button.setAttribute('aria-label', 'Add to favorites');
      } else if (className.includes('share')) {
        button.setAttribute('aria-label', 'Share');
      } else if (className.includes('next') || className.includes('forward')) {
        button.setAttribute('aria-label', 'Next');
      } else if (className.includes('prev') || className.includes('back')) {
        button.setAttribute('aria-label', 'Previous');
      } else {
        // Generic fallback
        button.setAttribute('aria-label', 'Button');
      }
    }
  });
  
  // Fix images without alt text
  const images = document.querySelectorAll('img:not([alt])');
  images.forEach((img) => {
    img.setAttribute('alt', '');
  });
  
  // Fix links without text
  const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
  links.forEach((link) => {
    if (!link.textContent.trim() && link.querySelector('svg')) {
      link.setAttribute('aria-label', 'Link');
    }
  });
};

// Run on DOM changes
export const setupAccessibilityObserver = () => {
  const observer = new MutationObserver(() => {
    fixAccessibility();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Initial fix
  fixAccessibility();
  
  return observer;
};
