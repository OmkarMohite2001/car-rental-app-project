import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { LoaderService } from './core/loader.service';
import { GlobalLoader } from './components/layout/global-loader/global-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly themeService = inject(ThemeService);
  protected readonly loaderService = inject(LoaderService);
  protected readonly title = signal('car-rental-app');

  constructor() {
    // force ThemeService initialization at app startup
    this.themeService.theme();
  }
}
