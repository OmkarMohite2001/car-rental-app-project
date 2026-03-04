import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type ActivityType = 'booking' | 'payment' | 'return' | 'alert';

interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  time: string;
  type: ActivityType;
}

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './activity-timeline.html',
  styleUrl: './activity-timeline.scss',
})
export class ActivityTimeline {
  activities = signal<ActivityItem[]>([
    {
      id: 'ev-1',
      title: 'New booking confirmed',
      meta: 'BK-1053 • Pune Airport',
      time: '2 min ago',
      type: 'booking',
    },
    {
      id: 'ev-2',
      title: 'Security deposit captured',
      meta: '₹ 5,000 • BK-1050',
      time: '11 min ago',
      type: 'payment',
    },
    {
      id: 'ev-3',
      title: 'Vehicle returned',
      meta: 'MH12AB1234 • No damage found',
      time: '26 min ago',
      type: 'return',
    },
    {
      id: 'ev-4',
      title: 'Maintenance alert raised',
      meta: 'Tyre wear threshold crossed',
      time: '48 min ago',
      type: 'alert',
    },
  ]);

  iconFor(type: ActivityType) {
    switch (type) {
      case 'booking':
        return 'event_available';
      case 'payment':
        return 'payments';
      case 'return':
        return 'assignment_return';
      default:
        return 'warning';
    }
  }
}
