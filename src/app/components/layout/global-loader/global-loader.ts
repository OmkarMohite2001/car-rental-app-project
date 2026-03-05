import { Component, input } from '@angular/core';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.scss',
})
export class GlobalLoader {
  readonly label = input<string>('Loading...');
  readonly detail = input<string>('Please wait while we prepare your workspace.');
}
