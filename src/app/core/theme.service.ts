import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';
export type BrandPreset = 'ocean' | 'sand' | 'slate' | 'sunset' | 'aurora';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeOverrideStorageKey = 'rentx-theme-override';
  private readonly brandStorageKey = 'rentx-brand';
  private readonly systemThemeQuery: MediaQueryList | null =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: light)')
      : null;
  private readonly systemThemeChangeHandler = (event: MediaQueryListEvent) => {
    // Keep following system preference only if there is no user override.
    if (this.resolveThemeOverride() !== null) {
      return;
    }
    this.applyResolvedTheme(event.matches ? 'light' : 'dark');
  };

  readonly theme = signal<ThemeMode>('dark');
  readonly brand = signal<BrandPreset>('ocean');

  constructor() {
    const initialBrand = this.resolveInitialBrand();
    const overrideTheme = this.resolveThemeOverride();
    const initialTheme = overrideTheme ?? this.resolveSystemTheme();

    this.brand.set(initialBrand);

    this.applyResolvedTheme(initialTheme);
    this.applyBrand(initialBrand);
    this.bindSystemThemeSync();
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode) {
    this.persistThemeOverride(theme);
    this.applyResolvedTheme(theme);
  }

  useSystemTheme() {
    this.clearThemeOverride();
    this.applyResolvedTheme(this.resolveSystemTheme());
  }

  setBrand(brand: BrandPreset) {
    this.brand.set(brand);
    this.persistBrand(brand);
    this.applyBrand(brand);
  }

  private bindSystemThemeSync() {
    if (!this.systemThemeQuery) {
      return;
    }
    this.systemThemeQuery.addEventListener('change', this.systemThemeChangeHandler);
  }

  private resolveSystemTheme(): ThemeMode {
    return this.systemThemeQuery?.matches ? 'light' : 'dark';
  }

  private resolveThemeOverride(): ThemeMode | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedTheme = window.localStorage.getItem(this.themeOverrideStorageKey);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return null;
  }

  private resolveInitialBrand(): BrandPreset {
    if (typeof window === 'undefined') {
      return 'ocean';
    }

    const storedBrand = window.localStorage.getItem(this.brandStorageKey);
    if (
      storedBrand === 'ocean' ||
      storedBrand === 'sand' ||
      storedBrand === 'slate' ||
      storedBrand === 'sunset' ||
      storedBrand === 'aurora'
    ) {
      return storedBrand;
    }
    return 'ocean';
  }

  private persistThemeOverride(theme: ThemeMode) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.themeOverrideStorageKey, theme);
  }

  private clearThemeOverride() {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(this.themeOverrideStorageKey);
  }

  private persistBrand(brand: BrandPreset) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.brandStorageKey, brand);
  }

  private applyResolvedTheme(theme: ThemeMode) {
    this.theme.set(theme);
    this.applyTheme(theme);
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
    document.body.classList.toggle('brand-sunset', brand === 'sunset');
    document.body.classList.toggle('brand-aurora', brand === 'aurora');
    document.documentElement.setAttribute('data-brand', brand);
  }
}
