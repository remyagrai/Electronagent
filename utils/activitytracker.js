export function trackLaptopActivity(callback) {
  let inactiveTimeout;
  const INACTIVE_THRESHOLD = 60000; // 1 min

  function setActive() {
    clearTimeout(inactiveTimeout);
    callback('Active');
    inactiveTimeout = setTimeout(() => callback('Inactive'), INACTIVE_THRESHOLD);
  }

  window.addEventListener('mousemove', setActive);
  window.addEventListener('keydown', setActive);
  window.addEventListener('mousedown', setActive);

  // Initially set active
  callback('Active');
}
