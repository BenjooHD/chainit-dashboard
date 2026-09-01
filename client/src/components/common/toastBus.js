let listener = null;

export function setToastListener(fn) {
  listener = fn;
}

export function emitToast(message, type = 'error') {
  if (listener) listener(message, type);
}
