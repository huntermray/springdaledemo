import { NbDialogService } from '@nebular/theme';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MapService } from '../../../pages/dashboard/map/map.service';
import { Subscription } from 'rxjs';
import { HomePanelComponent } from './home-panel/home-panel.component';

@Component({
  selector: 'ngx-edit-panel',
  templateUrl: './edit-panel.component.html',
  styleUrls: ['./edit-panel.component.scss'],
})
export class EditPanelComponent implements OnInit {

  public mapClickSub: Subscription;
  @Output() featureSelected = new EventEmitter<string>();
  loadedFeature = '';
  public panelContent: string = 'search';
  featureData: any;
  // active list that key matches the tab name
  activeList = {
    // Home: true,
    People: false,
    Burials: false,
    Sales: false,
    Gravesites: false,
  };

  constructor(private mapService: MapService) { }

  ngOnInit() {
    this.mapClickSub = this.mapService.mapClickResults$.subscribe(clickdata => {
      // only navigate if features are returned from the selection on the map
      if (clickdata.length > 0) {
        this.onNavigate({
          type: 'Gravesites',
          data: {
            Gravesites: clickdata[0].attributes,
          },
        });
      } else {
        this.onNavigate({
          type: 'Gravesites',
          data: {
            Gravesites: {},
          },
        });
      }
    });
  }

  onNavigate(evt) {
    // console.log('onNavigate ', evt.data);
    this.featureData = evt.data;
    this.toggleTab(evt.type);
  }

  // toggle which tab is selected
  toggleTab(tab: string) {
    for (const key in this.activeList) {
      if (this.activeList.hasOwnProperty(key)) {
        if (key === tab) {
          this.activeList[key] = true;
        } else {
          this.activeList[key] = false;
        }
      }
    }
    this.activeList[tab] = true;
  }

  // event listener for selecting a different tab
  selectTab(evt) {
    for (const key in this.activeList) {
      if (this.activeList.hasOwnProperty(key)) {
        if (key === evt.tabTitle && evt.activeValue === true) {
          this.activeList[key] = true;
        } else {
          this.activeList[key] = false;
        }
      }
    }
  }

  // Load the selected component
  onSelect(feature: string) {
    try {
      this.featureSelected.emit(feature);
      console.log('FeatureSelected: ', feature);
    } catch (e) {
      console.warn('Trouble emitting featureSelected: ', e);
    }
  }

}
