import { TestBed, inject } from '@angular/core/testing';

import { FieldsControlService } from './fields-control.service';

describe('FieldsControlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FieldsControlService]
    });
  });

  it('should be created', inject([FieldsControlService], (service: FieldsControlService) => {
    expect(service).toBeTruthy();
  }));
});
