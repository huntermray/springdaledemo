import { NgModule } from '@angular/core';
import { NbMenuModule } from '@nebular/theme';
import { CoreModule } from '../@core/core.module';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { DashboardModule } from './dashboard/dashboard.module';

@NgModule({
  imports: [
    ThemeModule,
    NbMenuModule,
    DashboardModule,
    CoreModule,
  ],
  declarations: [
    PagesComponent,
  ],
  exports: [PagesComponent],
})
export class PagesModule {
}
