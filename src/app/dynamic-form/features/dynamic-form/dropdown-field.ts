import { FieldsBase } from './fields-base';

export class DropdownField extends FieldsBase<string> {
  controlType = 'dropdown';
  options: {code: string, value: string}[] = [];

  constructor(options: {} = {}) {
    super(options);
    this.options = options['options'] || [];
  }
}
