import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface FabAction {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-command-fab',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './command-fab.html',
  styleUrl: './command-fab.scss',
})
export class CommandFab {
  open = signal(false);

  actions: FabAction[] = [
    { label: 'New Booking', icon: 'add_circle', link: '/layout/manage-bookings' },
    { label: 'Add Customer', icon: 'person_add', link: '/layout/customers' },
    { label: 'Add Car', icon: 'directions_car', link: '/layout/car-master' },
    { label: 'Reports', icon: 'analytics', link: '/layout/reports' },
  ];

  toggle() {
    this.open.update((v) => !v);
  }

  close() {
    this.open.set(false);
  }
}
