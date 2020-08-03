import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleRecordsComponent } from './sale-records.component';

describe('SaleRecordsComponent', () => {
  let component: SaleRecordsComponent;
  let fixture: ComponentFixture<SaleRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaleRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaleRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
