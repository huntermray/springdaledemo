import { Injectable } from '@angular/core';
import { loadModules } from 'esri-loader';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private user = new Subject<any>();
  user$ = this.user.asObservable();
  public userInfo: any;

  constructor() { }

  setIdentityManager() {
    return new Promise < boolean > ((resolve, reject) => {
      const appId = environment.appId;
      const self = this;
      const portalUrl = 'https://www.arcgis.com/sharing';
      loadModules([
          'esri/identity/OAuthInfo',
          'esri/identity/IdentityManager',
        ])
        .then(([OAuthInfo, esriId]) => {
          // subsitute your own client_id to identify who spawned the login and check for a matching redirect URI
          const info = new OAuthInfo({
            appId: appId,
            popup: false, // inline redirects don't require any additional app configuration
          });

          esriId.registerOAuthInfos([info]);

          esriId.checkSignInStatus(portalUrl).then(async user => {
            self.userInfo = await self.getUserInfo(user.userId);
            self.user.next(self.userInfo);
            resolve(true);
          }).catch(() => {
            console.log('not logged into AGOL');
            self.directToArcGISOnline();
            resolve(false);
          });
        });
    });
  }

  directToArcGISOnline() {
    loadModules([
      'esri/identity/IdentityManager',
    ])
    .then(([esriId]) => {
      const portalUrl = 'https://www.arcgis.com/sharing';
      // check if logged in
      esriId.checkSignInStatus(portalUrl).then(
        function() {
          console.log('logged in!!!!!! directToArcGISOnline');
        },
      ).catch(() => {
        console.log('log in: ', portalUrl);
        // redirect to AGO
        esriId.getCredential(portalUrl);
      });
    });
  }

  async getUserInfo(userId) {
    return new Promise((resolve, reject) => {
      loadModules(['esri/request']).then(([esriRequest]) => {
        esriRequest('https://www.arcgis.com/sharing/rest/community/users/' + userId, {
          responseType: 'json',
          authMode: 'auto',
          query: {
            f: 'json',
          },
        }).then(function(response) {
          resolve(response.data);
        });
      });
    });
  }

  async getCredential() {
    return new Promise((resolve, reject) => {
      loadModules(['esri/identity/IdentityManager']).then(([esriId]) => {
        esriId.getCredential('https://www.arcgis.com').then((result) => {
          resolve(result);
        }).catch((err) => {
          console.error(err);
          reject(err);
        });
        resolve();
      });
    });
  }

  logout() {
    const self = this;
    loadModules([
      'esri/identity/IdentityManager',
    ])
    .then(([esriId]) => {
      // log out!
      // remove user from local storage to log user out
      esriId.on('credentials-destroy', () => {
        // localStorage.removeItem('currentUser');
        self.directToArcGISOnline();
      });
      esriId.destroyCredentials();
    });
  }
}
