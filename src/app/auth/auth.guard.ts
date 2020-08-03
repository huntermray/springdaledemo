import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../@core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const authPromise = new Promise<boolean>((resolve, reject) => {
        this.authService.setIdentityManager().then(status => {
          // console.log('log in status at guard: ', status);
          if (status === true) {
            resolve(true);
          } else {
            resolve(false);
            this.authService.directToArcGISOnline();
          }
        });
      });
      return authPromise;
      // return true;
  }
}
