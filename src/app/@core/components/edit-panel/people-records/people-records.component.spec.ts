import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleRecordsComponent } from './people-records.component';

describe('PeopleRecordsComponent', () => {
  let component: PeopleRecordsComponent;
  let fixture: ComponentFixture<PeopleRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeopleRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeopleRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
