/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { NbLayoutDirectionService, NbLayoutDirection } from '@nebular/theme';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {

  constructor(private analytics: AnalyticsService, private directionService: NbLayoutDirectionService) {
  }

  ngOnInit() {
    // set the application to align the panel on the right
    // console.log('direction ', this.directionService.getDirection());
    const newDirection = NbLayoutDirection;
    // console.log('newDirection ', newDirection);
    this.directionService.setDirection(newDirection.LTR);
    this.analytics.trackPageViews();
  }
}
