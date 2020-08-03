import { Component, Inject, AfterViewInit, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { MENU_ITEMS } from './pages-menu';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <ngx-edit-panel></ngx-edit-panel>
      <ngx-dashboard></ngx-dashboard>
    </ngx-one-column-layout>
  `,
})

export class PagesComponent implements AfterViewInit {

  menu = MENU_ITEMS;

  constructor(@Inject(DOCUMENT) private document, private elementRef: ElementRef) {
  }

  ngAfterViewInit() {
    const s = this.document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://northpointgis.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/qb6i7v/b/18/a44af77267a987a660377e5c46e0fb64/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?locale=en-US&collectorId=b75b717f';
    const __this = this; // to store the current instance to call
                         // afterScriptAdded function on onload event of
                         // script.
    s.onload = function () { __this.afterScriptAdded(); };
    this.elementRef.nativeElement.appendChild(s);
  }

  afterScriptAdded() {
    const params = {
      width: '350px',
      height: '420px',
    };
    if (typeof (window['functionFromExternalScript']) === 'function') {
      window['functionFromExternalScript'](params);
    }
  }
}
