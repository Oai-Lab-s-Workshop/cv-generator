import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-privacy-page',
  imports: [RouterLink, Navbar],
  templateUrl: './privacy-page.html',
  styleUrls: ['../../styles/home-shared.css', './privacy-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPage {}
