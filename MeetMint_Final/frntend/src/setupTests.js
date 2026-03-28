import '@testing-library/jest-dom';

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = () => ({
  beginPath: () => {},
  arc: () => {},
  fill: () => {},
  clearRect: () => {},
  createRadialGradient: () => ({
    addColorStop: () => {},
  }),
  fillRect: () => {},
  drawImage: () => {},
  putImageData: () => {},
  getImageData: () => ({ data: [] }),
  setTransform: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
});

// Mock window.alert
window.alert = (msg) => { console.log('Mocked alert:', msg); };
