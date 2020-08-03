import { ConfigService } from './../../../@core/services/config.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService, NbMenuItem } from '@nebular/theme';

import { UserData } from '../../../@core/data/users';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../../../@core/services/auth.service';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;
  applicationName: string = '';

  userMenu = [ { id: 'user-menu', title: 'Log out', data: { id: 'logout' } } ];

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private userService: UserData,
              private breakpointService: NbMediaBreakpointsService,
              private authService: AuthService,
              private config: ConfigService) {
  }

  async ngOnInit() {
    // listen for the logout click from the menu
    this.menuService.onItemClick().subscribe((item) => {
      const theItem = <any>item;
      if (theItem.item.data.id === 'logout') {
        this.authService.logout();
      }
    });
    if (this.authService.userInfo == null) {
      this.authService.user$.subscribe(theUser => {
        this.user = theUser;
      });
    } else {
      this.user = this.authService.userInfo;
    }
    try {
      this.applicationName = this.config.get('ApplicationName')
    } catch(e) {
      this.applicationName = 'Grave Editor';
    }

    const creds: any = await this.authService.getCredential();

    this.user.picture = 'https://www.arcgis.com/sharing/rest/community/users/' + this.user.username + '/info/' +
      this.user.thumbnail + '?token=' + creds.token;

    const { xl } = this.breakpointService.getBreakpointsMap();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  logout() {
    console.log('log out??');
  }
}
