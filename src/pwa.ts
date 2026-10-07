interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | undefined;

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

async function warmOfflineCache(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) return;

  const urls = [
    window.location.href,
    ...performance
      .getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(url => {
        try { return new URL(url).origin === window.location.origin; }
        catch { return false; }
      }),
  ];

  worker.postMessage({ type: 'CACHE_URLS', urls: [...new Set(urls)] });
}

export function setupPwa(
  installButton: HTMLButtonElement,
  onStatus: (message: string, error?: boolean) => void,
): void {
  installButton.hidden = true;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker
        .register('./sw.js')
        .then(() => warmOfflineCache())
        .catch(error => {
          onStatus(`Không đăng ký được offline cache: ${error instanceof Error ? error.message : String(error)}`, true);
        });
    });
  }

  if (isStandalone()) return;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    installButton.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = undefined;
    installButton.hidden = true;
    onStatus('Đã cài Typst Quiz lên thiết bị.');
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      onStatus('Nếu nút cài đặt không xuất hiện, mở menu Chrome → Thêm vào màn hình chính / Cài ứng dụng.');
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') onStatus('Đang hoàn tất cài đặt Typst Quiz.');

    deferredPrompt = undefined;
    installButton.hidden = true;
  });
}
