import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  templateUrl: './form-field.html',
  styleUrl: './form-field.css',
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() required = false;
  @Input() invalid = false;
  @Input() errorMessage = '';
  @Input() helperText = '';
  @Input() fieldId = '';
}
