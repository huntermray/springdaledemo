import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {

  private config: Object = null;

  constructor(private http: HttpClient) { }

  public get(key: any) {
    return this.config[key];
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.http.get < any > ('./assets/config/config.json') // .map(res => res.json())
        .subscribe((configResponse) => {
          this.config = configResponse;
          resolve(true);
        });
    });
  }
}
