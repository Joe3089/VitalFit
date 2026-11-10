export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): T {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: any[]) {
    const context = this;
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  } as T;
}
