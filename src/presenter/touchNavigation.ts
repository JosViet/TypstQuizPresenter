export interface SwipeNavigationHandlers {
  previous(): void;
  next(): void;
}

export interface SwipeOptions {
  threshold?: number;
  maxVerticalRatio?: number;
}

export type SwipeDirection = 'previous' | 'next' | undefined;

export function swipeDirection(
  dx: number,
  dy: number,
  options: SwipeOptions = {},
): SwipeDirection {
  const threshold = options.threshold ?? 72;
  const maxVerticalRatio = options.maxVerticalRatio ?? 0.75;

  if (Math.abs(dx) < threshold) return undefined;
  if (Math.abs(dy) > Math.abs(dx) * maxVerticalRatio) return undefined;
  return dx < 0 ? 'next' : 'previous';
}

export function installSwipeNavigation(
  element: HTMLElement,
  handlers: SwipeNavigationHandlers,
  options: SwipeOptions = {},
): () => void {
  let pointerId: number | undefined;
  let startX = 0;
  let startY = 0;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
  };

  const finish = (event: PointerEvent) => {
    if (pointerId === undefined || event.pointerId !== pointerId) return;
    const direction = swipeDirection(event.clientX - startX, event.clientY - startY, options);
    pointerId = undefined;

    if (direction === 'next') handlers.next();
    else if (direction === 'previous') handlers.previous();
  };

  const cancel = (event: PointerEvent) => {
    if (event.pointerId === pointerId) pointerId = undefined;
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointerup', finish);
  element.addEventListener('pointercancel', cancel);

  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointerup', finish);
    element.removeEventListener('pointercancel', cancel);
  };
}
