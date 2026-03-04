import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BrandPreset, ThemeService } from '../../core/theme.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { CommandFab } from '../../components/layout/command-fab/command-fab';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatMenuModule,
    CommandFab,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly themeService = inject(ThemeService);

  constructor(private router: Router) {}

  collapsed = signal(true);
  showSearch = signal(false);
  theme = this.themeService.theme;
  brand = this.themeService.brand;
  notifCount = signal(3);
  cartCount = signal(1);
  megaOpen = signal(false);
  readonly presets: Array<{ id: BrandPreset; label: string }> = [
    { id: 'ocean', label: 'Ocean' },
    { id: 'sand', label: 'Sand' },
    { id: 'slate', label: 'Slate' },
  ];

  toggle() {
    this.collapsed.update((v) => !v);
  }
  toggleSearch() {
    this.showSearch.update((v) => !v);
  }
  toggleMega() {
    this.megaOpen.update((v) => !v);
  }
  closeMega() {
    this.megaOpen.set(false);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setBrand(preset: BrandPreset) {
    this.themeService.setBrand(preset);
  }

  onGlobalSearch(ev: Event) {
    const q = (ev.target as HTMLInputElement).value.trim();
    console.log('Global search =>', q);
  }

  logOut() {
    const isConfirmed = confirm('Are you sure you want to go to Dashboard?');

    if (isConfirmed) {
      // yetha tumcha path/lazy route use kara
      this.router.navigate(['/login']);
    }
  }
}
