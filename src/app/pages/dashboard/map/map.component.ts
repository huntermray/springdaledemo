import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MapService } from './map.service';
import { ConfigService } from '../../../@core/services/config.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'ngx-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {

  @ViewChild('mapViewNode', {static: true}) private mapViewEl: ElementRef;

  constructor(private mapService: MapService, private config: ConfigService) { }

  ngOnInit() {
    this.mapService.loadMap(this.mapViewEl, this.config.get('webMapId' + environment.webmapSwitch));
  }

}
