import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldsBase } from '../fields-base';

@Component({
  selector: 'ngx-field',
  templateUrl: './dynamic-form-question.component.html',
  styleUrls: ['./dynamic-form-question.component.scss'],
})
export class DynamicFormQuestionComponent {

  constructor() { }

  @Input() field: FieldsBase<any>;
  @Input() form: FormGroup;
  // @Input() index: number;
  get isInvalid() { return this.form.controls[this.field.key].invalid; }

  mouseWheelUpFunc(evt) {
    // console.log('wheel up: ', evt);
  }

}
