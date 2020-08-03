import { FieldsBase } from './fields-base';

export class TextboxField extends FieldsBase<string> {
  controlType = 'textbox';
  type: string;
  length: number;

  constructor(options: {} = {}) {
    super(options);
    this.type = options['type'] || '';
    this.length = options['length'] || '';
  }
}
