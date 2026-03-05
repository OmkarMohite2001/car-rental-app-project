import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  readonly active = signal(false);
  readonly label = signal('Loading...');
  readonly detail = signal('Please wait while we prepare your workspace.');

  show(label = 'Loading...', detail = 'Please wait while we prepare your workspace.') {
    this.label.set(label);
    this.detail.set(detail);
    this.active.set(true);
  }

  hide() {
    this.active.set(false);
  }
}
