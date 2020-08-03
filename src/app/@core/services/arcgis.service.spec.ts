import { TestBed } from '@angular/core/testing';

import { ArcgisService } from './arcgis.service';

describe('ArcgisService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ArcgisService = TestBed.get(ArcgisService);
    expect(service).toBeTruthy();
  });
});
