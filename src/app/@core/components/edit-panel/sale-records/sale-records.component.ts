import { ConfigService } from './../../../services/config.service';
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MapService } from '../../../../pages/dashboard/map/map.service';
import { ArcgisService } from '../../../services/arcgis.service';
import { NbDialogService } from '@nebular/theme';
import { FeaturedataService } from '../../../../dynamic-form/features/featuredata.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'ngx-sale-records',
  templateUrl: './sale-records.component.html',
  styleUrls: ['./sale-records.component.scss'],
})
export class SaleRecordsComponent implements OnInit, OnChanges {

  @Output() navigate = new EventEmitter();
  @Input() data: any;

  deedNumber: number;
  dateMin: Date;
  dateMax: Date;
  searching: boolean = false;
  saleClicked: boolean = false;
  editClicked: boolean = false;
  personClicked: boolean = false;
  burialClicked: boolean = false;
  numSales: number = 0;
  numBurial: number = 0;
  numPeople: number = 0;
  numGraveSites: number = 0;
  allSales: Array < any > ;
  dataAvailable: boolean = false;
  formData: Array<any> = [];
  salesRecords: Array < any > = [];
  selectedSale: any;
  selectedPerson: any = '';
  p1: number = 1;
  selectedOption: string = 'owner';
  salesFound: boolean = true;
  tableDataLookUp = {
    owner: 'OwnerTable',
    representative: 'RepresentativeTable',
    deceased: 'DeceasedTable',
  };
  loading: boolean = false;
  allPeople: Array<any> = [];
  // personsName: string = '';
  personFName: string = '';
  personLName: string = '';
  p2: number = 1;
  selectedOwner: any;
  savingRelated: boolean = false;
  removeOwner: any;
  removingRelated: boolean = false;

  constructor(
    public arcgisService: ArcgisService,
    private mapService: MapService,
    private config: ConfigService,
    private dialogService: NbDialogService,
    private featureDataService: FeaturedataService) {}

  ngOnInit() {}

  async searchBySale() {
    try {
      let deedNoString = '';
      this.saleClicked = false;
      if (this.deedNumber === null && (this.dateMin == null && this.dateMax == null)) {
        this.allSales = [];
        this.numSales = 0;
        this.formData = [];
      } else {
        this.searching = true;
        if (this.deedNumber != null) {
          deedNoString = this.deedNumber.toString();
        } else {
          deedNoString = '';
        }
        const saleResults = < any > await this.arcgisService.userParameterSearch(deedNoString, 'sale', this.dateMin, this.dateMax);
        this.allSales = saleResults.features.map(a => (a.attributes));
        this.addDisplayValue();
        this.numSales = saleResults.features.length;
        this.searching = false;
        if (this.allSales != null) {
          if (this.allSales.length > 0) {
            this.dataAvailable = true;
            const selSale = this.allSales;
            const myobject = selSale[0];
            // console.log(myobject);
            this.formData = [{
              attributes: myobject,
              sourceLayer: {
                popupTemplate: this.mapService.salesTable.popupInfo,
                fields: this.mapService.salesTable.fields,
                url: this.mapService.salesTable.url,
              },
            }];
            this.salesRecords = selSale;
            this.addDisplayValue();
          } else {
            this.salesFound = false;
          }
        }
      }
    } catch (e) {
      console.warn('Could not complete the search', e);
      this.searching = false;
      this.salesFound = false;
    }
  }

  addDisplayValue() {
    // set the display for the results
    this.salesRecords.forEach(sale => {
      let displayString = this.config.get('salesSearchResults');
      for (const key in sale) {
        if (sale.hasOwnProperty(key)) {
          displayString = displayString.replace(key, sale[key]);
        }
      }
      sale.display = displayString;
    });
  }

  async selectSale(sale) {
    this.loading = true;
    this.saleClicked = true;
    this.selectedSale = sale;
    this.deedNumber = sale.grantno;
    // find the object id field first
    const oidField = this.mapService.salesTable.fields.filter(x => x.type === 'esriFieldTypeOID')[0];
    // get all of the related records
    const allRelationshipQueries = [];
    this.mapService.salesTable.relationships.forEach(relationship => {
      allRelationshipQueries.push(
        this.arcgisService.getRelatedTableData(
          this.mapService.salesTable.url, [sale[oidField.name]], relationship.id, relationship.name),
      );
    });
    const self = this;
    Promise.all(allRelationshipQueries).then(allResults => {
      // show the related sales records
      allResults.forEach(result => {
        // console.log(result);
        if (result.name === 'Gravesites') {
          const objectIDArr = [];
          result.results.relatedRecordGroups.forEach(relatedRecords => {
            relatedRecords.relatedRecords.forEach(aRelatedRecord => {
              objectIDArr.push(aRelatedRecord.attributes.OBJECTID);
            });
          });
          self.mapService.getFullGeometry(objectIDArr);
        }
      });
      this.loading = false;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data.currentValue != null && changes.data.currentValue.SalesRecords != null) {
      // console.log('Sales relguid: ', changes.data.currentValue.relatedGlobalID);
      // console.log('Sales data: ', changes.data.currentValue);
      this.saleClicked = true;
      const selSale = changes.data.currentValue.SalesRecords;
      this.selectedSale = changes.data.currentValue.SalesRecords;
      this.selectedPerson = changes.data.currentValue.SelectedPerson;
      if (this.isEmptyObject(selSale) === true) {
        // console.log(this.mapService.salesTable);
        this.arcgisService.getMaxValue(this.mapService.salesTable.url, 'grantno').then( result => {
          selSale.grantno = result + 1;
          this.formData = [{
            attributes: selSale,
            sourceLayer: {
              popupTemplate: this.mapService.salesTable.popupInfo,
              fields: this.mapService.salesTable.fields,
              url: this.mapService.salesTable.url,
            },
            type: 'table',
            editType: 'add',
            relatedGlobalID: {
              id: changes.data.currentValue.relatedGlobalID,
              type: 'Sales',
              from: changes.data.currentValue.from,
            },
          }];
          this.editClicked = true;
        });
      } else {
        this.formData = [{
          attributes: selSale,
          sourceLayer: {
            popupTemplate: this.mapService.salesTable.popupInfo,
            fields: this.mapService.salesTable.fields,
            url: this.mapService.salesTable.url,
          },
          type: 'table',
          editType: 'update',
        }];
        // get the related table information
        // console.log('selSale ', selSale);
        this.deedNumber = selSale.grantno;
        this.selectSale(selSale);
      }
    }
  }

  // edit the selected person
  editSale(edit) {
    if (this.loading === true) {
      return;
    }
    // console.log(this.selectedPerson);
    this.editClicked = edit;
    // show the editing panel for the selected person
    this.formData = [{
      attributes: this.selectedSale,
      sourceLayer: {
        popupTemplate: this.mapService.salesTable.popupInfo,
        fields: this.mapService.salesTable.fields,
        url: this.mapService.salesTable.url,
      },
      type: 'table',
      editType: 'update',
    }];
  }

  // select a burial record and show the burial editing panel
  selectPeople(people, type) {
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'People',
      data: {
        OwnerTable: people,
        type: type,
      },
    });
    this.clearResults();
  }

  // select a grave record and show the grave editing panel
  selectGrave(grave) {
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'Gravesites',
      data: {
        Gravesites: grave,
        SelectedPerson: this.selectedPerson,
      },
    });
    this.clearResults();
  }

  // add a new person record
  addNewPerson() {
    this.navigate.emit({
      type: 'People',
      data: {
        peopleRecords: {},
        relatedGlobalID: this.selectedSale.GlobalID,
        SelectedPerson: this.selectedPerson,
        editClicked: true,
        type: 'Owner',
      },
    });
  }

  addGravesiteConnection(dialog) {
    // this.navigate.emit({
    //   editClicked: true,
    //   type: 'Gravesites',
    //   data: {
    //     graveRecords: {},
    //     relatedGlobalID: this.selectedSale.GlobalID,
    //     // editClicked: true,
    //   },
    // });
    this.dialogService.open(
      dialog, {
        context: 'Click on the map to select the gravesite you would like to attach this sales record too.\nComing soon!',
        closeOnBackdropClick: false,
      });
  }

  // start the gravesite tool for selected a gravesite on the map to connect the sales record
  confirmAddGraveConnection() {
    console.log('coming soon!');
  }

  addNewSale() {
    // console.log('type: ', this.tableDataLookUp);
    this.saleClicked = true;
    this.editClicked = true;
    // show the editing panel for the selected person
    this.formData = [{
      attributes: {},
      sourceLayer: {
        popupTemplate: this.mapService.salesTable.popupInfo,
        fields: this.mapService.salesTable.fields,
        url: this.mapService.salesTable.url,
      },
      type: 'table',
      editType: 'add',
    }];
  }

  addExistingPerson(dialog) {
    this.dialogService.open(
      dialog, {
        context: 'Search for an existing owner to attach to this sales record: ',
        closeOnBackdropClick: false,
      });
  }

  // start the gravesite tool for selected a gravesite on the map to connect the sales record
  confirmAddOwnerConnection(dialog) {
    // console.log('Add this owner: ', this.selectedOwner);
    // console.log('Add to this sale: ', this.selectedSale);
    this.savingRelated = true;
    this.featureDataService.addPeopleRelationshipRecord(
      this.config.get('SalesToOwnerRelTable' + environment.webmapSwitch),
      this.selectedOwner.GlobalID, this.selectedSale.GlobalID).then(relSaveResults => {
        console.log('saved relationship! ', relSaveResults);
        this.savingRelated = false;
        dialog.close();
        this.selectSale(this.selectedSale);
      });
  }

  doneSaving(evt) {
    // update the client-side data with the updated saved record
    // console.log('evt: ', evt);
    this.arcgisService.setData('SalesRecords', evt);
    if (evt.type === 'add') {
      this.selectedSale = evt.data;
      this.selectSale(this.selectedSale);
    }
    this.formData[0].editType = 'update';
    this.formData[0].attributes = evt.data;
    // if the globalid came back add that to the attributes
    if (evt.globalId != null) {
      this.formData[0].attributes.GlobalID = evt.globalId;
    }
  }

  cancel() {
    this.saleClicked = false;
    // this.allSales = [];
    // this.numSales = 0;
    // this.editClicked = false;
    console.log('cancel');
    this.clearResults();
  }

  clearResults() {
    this.allSales = [];
    this.formData = [];
    this.saleClicked = false;
    this.deedNumber = null;
    this.salesRecords = [];
    this.numSales = 0;
    this.dateMin = null;
    this.dateMax = null;
    this.selectedPerson = '';
    // this.pid = '';
    this.arcgisService.clearData();
  }

  async searchByName() {
    if (this.personFName.length >= 2 || this.personLName.length >= 2) {
      this.searching = true;
      let peopleResults;
      const names = {
        LName: this.personLName,
        FName: this.personFName,
      };
      try {
        peopleResults = <any>await this.arcgisService.userParameterSearch(names, 'owner');
      } catch (error) {
        this.searching = false;
        alert('Error querying the people table.  ' + error.message);
      }
      // console.log(peopleResults);
      this.allPeople = peopleResults.features.map(a => (a.attributes));
      // console.log(this.allPeople);
      // set the display for the results
      this.allPeople.forEach(person => {
        let displayString = this.config.get('ownerSearchResults');
        for (const key in person) {
          if (person.hasOwnProperty(key)) {
            displayString = displayString.replace(key, person[key]);
          }
        }
        person.display = displayString;
      });
      this.allPeople = this._sortByName(this.allPeople);
      this.numPeople = peopleResults.features.length;
      console.log('Number of people', this.numPeople);
      this.searching = false;
      // if (this.selectedOption === 'deceased') {
      //   this.getRelatedRecords(this.allPeople);
      // }
      if (this.numPeople === 0) {
        // this.peopleFound = false;
        console.log('people not found...?');
      }
    } else {
      // this.searchByPID();
      this.clearResults();
      this.allPeople = [];
      this.formData = [];
      this.arcgisService.clearData();
    }
  }

  // select the person to associate to a sale
  selectPerson(person) {
    this.selectedOwner = person;
  }

  // confirm the removal of an owner connection
  disassociateOwner(dialog, person) {
    this.removeOwner = person;
    this.dialogService.open(
      dialog, {
        context: 'Are you sure you\'d like to remove this person from this sales record?',
        closeOnBackdropClick: false,
      });
  }

  // actually remove the owner connection
  confirmRemoveConnection(dialog) {
    // console.log('remove: ', this.removeOwner);
    this.removingRelated = true;
    this.featureDataService.removePeopleRelationshipRecord(
      this.config.get('SalesToOwnerRelTable' + environment.webmapSwitch),
      this.removeOwner.GlobalID, this.selectedSale.GlobalID).then(relDelResults => {
        // console.log('removed relationship! ', relDelResults);
        this.removingRelated = false;
        dialog.close();
        this.selectSale(this.selectedSale);
      });
  }

  // helper
  isEmptyObject(obj) {
    return (obj && (Object.keys(obj).length === 0));
  }

  // sort search results by name
  _sortByName(names) {
    // add a blank option
    // codedValues.push({ name: 'Clear', code: null });
    return names.sort((a, b) => {
      if (a.surname < b.surname) {
        return -1;
      } else if (a.surname > b.surname) {
        return 1;
      } else {
        return 0;
      }
    });
  }

}
