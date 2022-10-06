/**
 * @param {string} id
 */
export function disableButton(id) {
  const button = document.getElementById(id);
  if (!button) {
    throw new Error(`Button with id ${id} not found`);
  }
  button.disabled = true;
}

/**
 * @param {string} id
 */
export function enableButton(id) {
  const button = document.getElementById(id);
  if (!button) {
    throw new Error(`Button with id ${id} not found`);
  }
  button.disabled = false;
}

/**
 * @param {string} selector
 * @param {string} className
 */
export function addClassToElement(selector, className) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.classList.add(className);
}

/**
 * @param {string} selector
 * @param {string} className
 */
export function removeClassFromElement(selector, className) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.classList.remove(className);
}

/**
 * @param {string} selector
 */
export function showElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.style.display = 'initial';
}

/**
 * @param {string} selector
 */
export function hideElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element with selector ${selector} not found`);
  }
  element.style.display = 'none';
}
