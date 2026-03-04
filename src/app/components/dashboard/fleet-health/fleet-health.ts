import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface HealthMetric {
  label: string;
  value: number;
  tone: 'good' | 'warn' | 'risk';
}

@Component({
  selector: 'app-fleet-health',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './fleet-health.html',
  styleUrl: './fleet-health.scss',
})
export class FleetHealth {
  score = signal(86);

  metrics = signal<HealthMetric[]>([
    { label: 'Ready for dispatch', value: 90, tone: 'good' },
    { label: 'Service due soon', value: 28, tone: 'warn' },
    { label: 'Critical alerts', value: 8, tone: 'risk' },
  ]);

  private readonly circumference = 2 * Math.PI * 44;

  ringOffset = computed(() => this.circumference * (1 - this.score() / 100));
}
