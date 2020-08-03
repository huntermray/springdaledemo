import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldsBase } from './fields-base';

@Injectable()
export class FieldsControlService {

  constructor() { }

  toFormGroup(fields: FieldsBase<any>[] ) {
    const group: any = {};

    fields.forEach(question => {
      group[question.key] = question.required ? new FormControl(question.value || '', Validators.required)
                                              : new FormControl(question.value || '');
    });
    return new FormGroup(group);
  }

}
