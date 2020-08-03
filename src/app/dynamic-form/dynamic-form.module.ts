import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FeaturesComponent } from './features/features.component';
import {
  DynamicFormQuestionComponent } from './features/dynamic-form/dynamic-form-question/dynamic-form-question.component';
import { NbCheckboxModule, NbInputModule, NbButtonModule, NbSpinnerModule, NbSelectModule,
  NbDatepickerModule, NbTabsetModule, NbIconModule, NbToggleModule } from '@nebular/theme';
  import { MousewheelDirective } from './directives/mousewheel.directive';

@NgModule({
  declarations: [
    FeaturesComponent,
    DynamicFormQuestionComponent,
    MousewheelDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NbCheckboxModule,
    NbInputModule,
    NbButtonModule,
    NbSpinnerModule,
    NbSelectModule,
    NbDatepickerModule.forRoot(),
    NbTabsetModule,
    NbIconModule,
    NbToggleModule,
  ],
  exports: [FeaturesComponent],
})
export class DynamicFormModule { }
