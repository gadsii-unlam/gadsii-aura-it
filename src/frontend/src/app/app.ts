import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/** Never reload under the customer's feet in the middle of paying. */
const isSafeToReload = (url: string) => !url.startsWith('/pago') && !url.startsWith('/checkout');

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    this.activateNewVersions();
  }

  /**
   * The service worker keeps serving the cached build until it is told to
   * switch. During test sessions the team redeploys often, so a downloaded
   * new version is applied right away, or at the next safe screen.
   */
  private activateNewVersions(): void {
    const updates = inject(SwUpdate);
    if (!updates.isEnabled) return;
    const router = inject(Router);
    let pending = false;

    const reloadIfSafe = () => {
      if (pending && isSafeToReload(router.url)) document.location.reload();
    };
    const versions = updates.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_READY'))
      .subscribe(() => {
        pending = true;
        reloadIfSafe();
      });
    const navigations = router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(reloadIfSafe);

    inject(DestroyRef).onDestroy(() => {
      versions.unsubscribe();
      navigations.unsubscribe();
    });
  }
}
