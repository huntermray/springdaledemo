import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GravesiteRecordsComponent } from './gravesite-records.component';

describe('GravesiteRecordsComponent', () => {
  let component: GravesiteRecordsComponent;
  let fixture: ComponentFixture<GravesiteRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GravesiteRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GravesiteRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
