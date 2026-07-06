import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly loginQueryParams = computed(() => {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    return returnUrl ? { returnUrl } : null;
  });
}
