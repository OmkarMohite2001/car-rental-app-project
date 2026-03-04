import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';
export type BrandPreset = 'ocean' | 'sand' | 'slate';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeStorageKey = 'rentx-theme';
  private readonly brandStorageKey = 'rentx-brand';

  readonly theme = signal<ThemeMode>('dark');
  readonly brand = signal<BrandPreset>('ocean');

  constructor() {
    const initialTheme = this.resolveInitialTheme();
    const initialBrand = this.resolveInitialBrand();

    this.theme.set(initialTheme);
    this.brand.set(initialBrand);

    this.applyTheme(initialTheme);
    this.applyBrand(initialBrand);
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode) {
    this.theme.set(theme);
    this.persistTheme(theme);
    this.applyTheme(theme);
  }

  setBrand(brand: BrandPreset) {
    this.brand.set(brand);
    this.persistBrand(brand);
    this.applyBrand(brand);
  }

  private resolveInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const storedTheme = window.localStorage.getItem(this.themeStorageKey);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  private resolveInitialBrand(): BrandPreset {
    if (typeof window === 'undefined') {
      return 'ocean';
    }

    const storedBrand = window.localStorage.getItem(this.brandStorageKey);
    if (storedBrand === 'ocean' || storedBrand === 'sand' || storedBrand === 'slate') {
      return storedBrand;
    }
    return 'ocean';
  }

  private persistTheme(theme: ThemeMode) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.themeStorageKey, theme);
  }

  private persistBrand(brand: BrandPreset) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.brandStorageKey, brand);
  }

  private applyTheme(theme: ThemeMode) {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.style.colorScheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  private applyBrand(brand: BrandPreset) {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.toggle('brand-ocean', brand === 'ocean');
    document.body.classList.toggle('brand-sand', brand === 'sand');
    document.body.classList.toggle('brand-slate', brand === 'slate');
    document.documentElement.setAttribute('data-brand', brand);
  }
}
