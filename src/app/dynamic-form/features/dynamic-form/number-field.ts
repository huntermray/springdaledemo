import { FieldsBase } from './fields-base';

export class NumberField extends FieldsBase<string> {
  controlType = 'numberbox';
  type: string;

  constructor(options: {} = {}) {
    super(options);
    this.type = options['type'] || '';
  }
}
