import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-icon-label-data',
    imports: [],
    templateUrl: './icon-label-data.html',
    styleUrl: './icon-label-data.css',
})
export class IconLabelData {
    @Input() label: string | undefined = ''
    @Input() data: string | undefined = ''
    @Input() reverse: boolean = false;

    isLink(value: string | undefined | null): boolean {
        if (!value?.trim()) {
            return false;
        }

        try {
            const normalizedValue = this.getLinkHref(value);
            const url = new URL(normalizedValue);

            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    getLinkHref(value: string | undefined | null): string {
        const trimmedValue = value?.trim() ?? '';

        if (!trimmedValue) {
            return '';
        }

        if (/^https?:\/\//i.test(trimmedValue)) {
            return trimmedValue;
        }

        return `https://${trimmedValue}`;
    }
}
