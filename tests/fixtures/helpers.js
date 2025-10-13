// Utility functions

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function average(arr) {
  return arr.length ? sum(arr) / arr.length : 0;
}

function max(arr) {
  return Math.max(...arr);
}

module.exports = { sum, average, max };

