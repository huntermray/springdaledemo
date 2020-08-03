import { FieldsBase } from './fields-base';

export class DateField extends FieldsBase<string> {
  controlType = 'date';

  constructor(options: {} = {}) {
    super(options);
  }
}
