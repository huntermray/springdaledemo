import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BurialRecordsComponent } from './burial-records.component';

describe('BurialRecordsComponent', () => {
  let component: BurialRecordsComponent;
  let fixture: ComponentFixture<BurialRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BurialRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BurialRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
