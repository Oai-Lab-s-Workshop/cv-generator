import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

const COOKIE_CONSENT_KEY = 'resumate-cookie-consent';

@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBanner implements OnInit {
  readonly visible = signal(false);

  ngOnInit(): void {
    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
      this.visible.set(true);
    }
  }

  acceptCookies(): void {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    this.visible.set(false);
  }
}
