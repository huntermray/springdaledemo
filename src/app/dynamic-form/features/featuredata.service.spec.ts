import { TestBed, inject } from '@angular/core/testing';

import { FeaturedataService } from './featuredata.service';

describe('FeaturedataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeaturedataService]
    });
  });

  it('should be created', inject([FeaturedataService], (service: FeaturedataService) => {
    expect(service).toBeTruthy();
  }));
});
