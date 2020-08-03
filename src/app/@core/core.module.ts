import { NgxPaginationModule } from 'ngx-pagination';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbAuthModule, NbDummyAuthStrategy } from '@nebular/auth';
import { NbSecurityModule, NbRoleProvider } from '@nebular/security';
import { NbCheckboxModule, NbToggleModule, NbInputModule, NbButtonModule, NbSpinnerModule, NbSelectModule,
  NbDatepickerModule, NbTabsetModule, NbIconModule, NbCardModule, NbRadioModule, NbMenuModule } from '@nebular/theme';
import { of as observableOf } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DynamicFormModule } from '../dynamic-form/dynamic-form.module';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { AnalyticsService } from './utils';
import { UserData } from './data/users';
import { UserService } from './mock/users.service';
import { MockDataModule } from './mock/mock-data.module';
import { EditPanelComponent } from './components/edit-panel/edit-panel.component';
import { BurialRecordsComponent } from './components/edit-panel/burial-records/burial-records.component';
import { PeopleRecordsComponent } from './components/edit-panel/people-records/people-records.component';
import { GravesiteRecordsComponent } from './components/edit-panel/gravesite-records/gravesite-records.component';
import { SaleRecordsComponent } from './components/edit-panel/sale-records/sale-records.component';
import { HomePanelComponent } from './components/edit-panel/home-panel/home-panel.component';

const socialLinks = [
  {
    url: 'https://github.com/akveo/nebular',
    target: '_blank',
    icon: 'github',
  },
  {
    url: 'https://www.facebook.com/akveo/',
    target: '_blank',
    icon: 'facebook',
  },
  {
    url: 'https://twitter.com/akveo_inc',
    target: '_blank',
    icon: 'twitter',
  },
];

const DATA_SERVICES = [
  { provide: UserData, useClass: UserService },
];

export class NbSimpleRoleProvider extends NbRoleProvider {
  getRole() {
    // here you could provide any role based on any auth flow
    return observableOf('guest');
  }
}

export const NB_CORE_PROVIDERS = [
  ...MockDataModule.forRoot().providers,
  ...DATA_SERVICES,
  ...NbAuthModule.forRoot({

    strategies: [
      NbDummyAuthStrategy.setup({
        name: 'email',
        delay: 3000,
      }),
    ],
    forms: {
      login: {
        socialLinks: socialLinks,
      },
      register: {
        socialLinks: socialLinks,
      },
    },
  }).providers,

  NbSecurityModule.forRoot({
    accessControl: {
      guest: {
        view: '*',
      },
      user: {
        parent: 'guest',
        create: '*',
        edit: '*',
        remove: '*',
      },
    },
  }).providers,

  {
    provide: NbRoleProvider, useClass: NbSimpleRoleProvider,
  },
  AnalyticsService,
];

@NgModule({
  imports: [
    CommonModule,
    NbCheckboxModule,
    NbToggleModule,
    NbInputModule,
    NbButtonModule,
    NbSpinnerModule,
    ReactiveFormsModule,
    FormsModule,
    DynamicFormModule,
    NbSelectModule,
    NbDatepickerModule.forRoot(),
    NbTabsetModule,
    NbIconModule,
    NbCardModule,
    NgxPaginationModule,
    NbRadioModule,
    NbMenuModule,
  ],
  exports: [
    NbAuthModule,
    EditPanelComponent,
  ],
  declarations: [
    EditPanelComponent,
    BurialRecordsComponent,
    PeopleRecordsComponent,
    GravesiteRecordsComponent,
    SaleRecordsComponent,
    HomePanelComponent,
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  static forRoot(): ModuleWithProviders {
    return <ModuleWithProviders>{
      ngModule: CoreModule,
      providers: [
        ...NB_CORE_PROVIDERS,
      ],
    };
  }
}
