import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly themeService = inject(ThemeService);
  protected readonly title = signal('car-rental-app');

  constructor() {
    // force ThemeService initialization at app startup
    this.themeService.theme();
  }
}
