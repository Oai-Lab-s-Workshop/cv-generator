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
}
