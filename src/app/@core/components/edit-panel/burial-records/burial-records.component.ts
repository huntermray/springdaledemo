import { ConfigService } from './../../../services/config.service';
import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MapService } from '../../../../pages/dashboard/map/map.service';
import { ArcgisService } from '../../../services/arcgis.service';
import { NbDialogService } from '@nebular/theme';
import { FeaturedataService } from '../../../../dynamic-form/features/featuredata.service';

@Component({
  selector: 'ngx-burial-records',
  templateUrl: './burial-records.component.html',
  styleUrls: ['./burial-records.component.scss'],
})
export class BurialRecordsComponent implements OnInit, OnChanges {

  @Output() navigate = new EventEmitter();
  @Input() data: any;

  dateMin: Date;
  dateMax: Date;
  personFName: string = '';
  personLName: string = '';
  serviceNumber: string = '';
  searching: boolean = false;
  burialClicked: boolean = false;
  numBurials: number = 0;
  numDeceased: number = 0;
  numRep: number = 0;
  numGraveSites: number = 0;
  burialRecords: Array<any> = [];
  dataAvailable: boolean = false;
  formData: Array<any> = [];
  selectedBurial: any;
  Clicked: boolean = false;
  editClicked: boolean = false;
  p3: number = 1;
  burialsFound: boolean = true;
  selectedPerson: any = '';
  loading: boolean = false;
  personsName: string = '';
  numPeople: number;
  allPeople: any;
  selectedDeceased: any;
  removeDeceased: any;
  removingRelated: boolean = false;
  savingRelated: boolean = false;
  serviceNo: string;
  removalType: string;
  existingSearchType: string;
  isLoading: boolean = false;

  constructor(
    public arcgisService: ArcgisService,
    private mapService: MapService,
    private config: ConfigService,
    private dialogService: NbDialogService,
    private featureDataService: FeaturedataService) {}

  ngOnInit() {
  }

  async searchByServiceNumber() {
    try {
      this.burialClicked = false;
      if (this.serviceNumber === '' && (this.dateMin == null && this.dateMax == null)) {
        this.burialRecords = [];
        this.numBurials = 0;
        this.formData = [];
        this.arcgisService.clearData();
      } else {
        this.searching = true;
        const burialResults = <any> await this.arcgisService.userParameterSearch(this.serviceNumber, 'burial', this.dateMin, this.dateMax);
        this.burialRecords = burialResults.features.map(a => (a.attributes));
        this.addDisplayValue();
        this.numBurials = burialResults.features.length;
        this.searching = false;
        if (this.burialRecords != null) {
          if (this.burialRecords.length > 0) {
            this.burialsFound = true;
            this.dataAvailable = true;
            const selBurial = this.burialRecords;
            const myobject = selBurial[0];
            // console.log(myobject);
            this.formData = [{
              attributes: myobject,
              sourceLayer: {
                popupTemplate: this.mapService.burialTable.popupInfo,
                fields: this.mapService.burialTable.fields,
                url: this.mapService.burialTable.url,
              },
            }];
            this.burialRecords = selBurial;
            this.addDisplayValue();
          } else {
            this.burialsFound = false;
          }
        }
      }
    } catch (e) {
      console.log('Could not complete the search');
      this.burialsFound = false;
      this.searching = false;
    }
  }

  addDisplayValue() {
    // set the display for the results
    this.burialRecords.forEach(burial => {
      let displayString = this.config.get('burialSearchResults');
      for (const key in burial) {
        if (burial.hasOwnProperty(key)) {
          displayString = displayString.replace(key, burial[key]);
        }
      }
      burial.display = displayString;
    });
  }

  async selectBurial(burial) {
    this.loading = true;
    this.burialClicked = true;
    this.selectedBurial = burial;
    this.serviceNo = burial[this.config.get('burialSearchResults')];
    // console.log('selected: ', this.selectedBurial);
    this.serviceNumber = burial[this.config.get('burialSearchResults')];
    // find the object id field first
    const oidField = this.mapService.burialTable.fields.filter(x => x.type === 'esriFieldTypeOID')[0];
    // get all of the related records
    const allRelationshipQueries = [];
    // loop through the related records and query each table
    this.mapService.burialTable.relationships.forEach(relationship => {
      allRelationshipQueries.push(
        this.arcgisService.getRelatedTableData(
          this.mapService.burialTable.url, [burial[oidField.name]], relationship.id, relationship.name),
      );
    });
    Promise.all(allRelationshipQueries).then(allResults => {
      // console.log(this.arcgisService.data);
      // show the related deceased records
      if (this.arcgisService.data.DeceasedTable.length === 0) {
        this.numDeceased = 0;
      } else {
        this.numDeceased = this.arcgisService.data.DeceasedTable.length;
      }

      // show the related representative records
      if (this.arcgisService.data.RepresentativeTable.length === 0) {
        this.numRep = 0;
      } else {
        this.numRep = this.arcgisService.data.RepresentativeTable.length;
      }

      // show the related grave site records
      if (this.arcgisService.data.Gravesites.length === 0) {
        this.numGraveSites = 0;
      } else {
        this.numGraveSites = this.arcgisService.data.Gravesites.length;
      }
      this.loading = false;
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.data.currentValue != null && changes.data.currentValue.BurialRecords != null) {
      // console.log('Burial: ', changes.data.currentValue.relatedGlobalID);
      // console.log('Burial record: ', changes.data.currentValue);
      this.dataAvailable = true;
      const selBurial = changes.data.currentValue.BurialRecords;
      this.selectedPerson = changes.data.currentValue.SelectedPerson;
      // console.log('selBurial ', selBurial);
      if (this.isEmptyObject(selBurial) === true) {
        this.isLoading = true;
        // get the max of all the pids to increment the pid numbers for deceased and representative
        this.clearResults();
        const burialServNoMax = <number> await this.arcgisService.getMaxValue(this.mapService.burialTable.url, 'servno__BurialID_');
        const burialPIDMax = <number> await this.arcgisService.getMaxValue(this.mapService.burialTable.url, 'pidno');
        const deceasedMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.deceased.url, 'pidno');
        const ownerMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.owner.url, 'pidno');
        const repMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.representative.url, 'pidno');
        const contactMax = <number> await this.arcgisService.getMaxValue(this.mapService.contactTable.url, 'pidno');
        const truePIDMax = Math.max(burialPIDMax, deceasedMax, ownerMax, repMax, contactMax);
        selBurial.servno__BurialID_ = burialServNoMax + 1;
        selBurial.pidno = truePIDMax + 1;
        selBurial.reppid = truePIDMax + 2;
        // console.log(changes.data.currentValue);
        this.formData = [{
          attributes: selBurial,
          sourceLayer: {
            popupTemplate: this.mapService.burialTable.popupInfo,
            fields: this.mapService.burialTable.fields,
            url: this.mapService.burialTable.url,
          },
          type: 'table',
          editType: 'add',
          relatedGlobalID: {
            id: changes.data.currentValue.relatedGlobalID,
            type: 'Burial',
            from: changes.data.currentValue.from,
          },
        }];
        this.isLoading = false;
        this.editClicked = true;
    } else {
      this.formData = [{
        attributes: selBurial,
        sourceLayer: {
          popupTemplate: this.mapService.burialTable.popupInfo,
          fields: this.mapService.burialTable.fields,
          url: this.mapService.burialTable.url,
        },
        type: 'table',
        editType: 'update',
      }];
      // select the correct burial and related records
      this.serviceNumber = selBurial[this.config.get('burialSearchResults')];
      this.selectBurial(selBurial);
    }
      // console.log('this.formData ', this.formData);
    }
  }

  doneSaving(evt) {
    // console.log(evt);
    // update the client-side data with the updated saved record
    this.arcgisService.setData('BurialRecords', evt);
    this.selectBurial(this.selectedBurial);
  }

  cancel() {
    this.burialClicked = false;
    // this.numBurials = 0;
    this.editClicked = false;
    // this.burialRecords = [];
    // console.log('cancel');
    this.clearResults();
  }

  // select a burial record and show the burial editing panel
  selectPeople(people, type) {
    // TODO: might consider changing this up to not be hard coded
    let tableName = '';
    if (type === 'deceased') {
      tableName = 'DeceasedTable';
    } else if (type === 'representative') {
      tableName = 'RepresentativeTable';
    }
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'People',
      data: {
        [tableName]: people,
        type: type,
        SelectedPerson: this.selectedPerson,
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

  // edit the selected burial
  editBurial(edit) {
    // console.log(this.selectedBurial);
    this.editClicked = edit;
    // show the editing panel for the selected burial
    this.formData = [{
      attributes: this.selectedBurial,
      sourceLayer: {
        popupTemplate: this.mapService.burialTable.popupInfo,
        fields: this.mapService.burialTable.fields,
        url: this.mapService.burialTable.url,
      },
      type: 'table',
      editType: 'update',
    }];
  }

  clearResults() {
    this.burialRecords = [];
    this.formData = [];
    this.burialClicked = false;
    this.serviceNumber = null;
    this.burialRecords = [];
    this.numBurials = 0;
    this.dateMin = null;
    this.dateMax = null;
    this.selectedPerson = '';
    this.editClicked = false;
    // this.pid = '';
    this.arcgisService.clearData();
  }
  // helper
  isEmptyObject(obj) {
    return (obj && (Object.keys(obj).length === 0));
  }

  // after saving a new person add them as the selected person object
  addBurialComplete(evt) {
    // console.log('add complete: ', evt);
    if (evt.type === 'add') {
      this.selectedBurial = evt.data;
      // console.log(this.selectedBurial);
      this.selectBurial(this.selectedBurial);
    }
    // set the pidno
    this.selectedBurial.pidno = evt.data.pidno;
    this.selectedBurial.reppid = evt.data.reppid;
    this.formData[0].editType = 'update';
    this.formData[0].attributes = evt.data;
  }

  // add a new person record
  addNewPerson(type) {
    // pass over the reppid or the pidno depending on which type of record is being added
    let relatedIdInfo;
    if (type === 'Representative') {
      relatedIdInfo = {pidno: this.selectedBurial.reppid};
    } else if (type === 'Deceased') {
      relatedIdInfo = {pidno: this.selectedBurial.pidno};
    }
    this.navigate.emit({
      type: 'People',
      data: {
        peopleRecords: relatedIdInfo,
        relatedGlobalID: this.selectedBurial.pidno,
        SelectedPerson: this.selectedPerson,
        editClicked: true,
        type: type,
      },
    });
  }

  addExistingPerson(dialog, type) {
    this.existingSearchType = type;
    this.dialogService.open(
      dialog, {
        context: 'Search for an existing deceased record to attach to this burial record: ',
        closeOnBackdropClick: false,
      });
  }

  async searchByName() {
    // console.log('search type for person search: ', this.existingSearchType);
    // this.personClicked = false;
    // this.editClicked = false;
    // console.log('You are searching by name');
    if (this.personFName.length >= 2 || this.personLName.length >= 2) {
      this.searching = true;
      let peopleResults;
      const names = {
        LName: this.personLName,
        FName: this.personFName,
      };
      try {
        if (this.existingSearchType === 'deceased') {
          peopleResults = <any>await this.arcgisService.userParameterSearch(names, 'deceased');
        } else if (this.existingSearchType === 'representative') {
          peopleResults = <any>await this.arcgisService.userParameterSearch(names, 'representative');
        }
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
      // console.log('Number of people', this.numPeople);
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

  // select the person to associate to a sale
  selectPerson(person) {
    this.selectedDeceased = person;
  }

  confirmAddDeceasedConnection(dialog) {
    // console.log('Add this deceased: ', this.selectedDeceased);
    // console.log('Add to this burial: ', this.selectedBurial);
    // console.log('burial: ', this.mapService.burialTable);
    const saveFeature = <any>{...this.selectedBurial};
    // console.log('search type for person search: ', this.existingSearchType);
    if (this.existingSearchType === 'deceased') {
      this.selectedBurial.pidno = this.selectedDeceased.pidno;
      saveFeature.pidno = this.selectedDeceased.pidno;
    } else if (this.existingSearchType === 'representative') {
      this.selectedBurial.reppid = this.selectedDeceased.pidno;
      saveFeature.reppid = this.selectedDeceased.pidno;
    }
    this.savingRelated = true;
    // console.log('saveFeature ', saveFeature);
    this.featureDataService.save(
      saveFeature, this.mapService.burialTable.url).then(relSaveResults => {
        // console.log('saved relationship! ', relSaveResults);
        this.savingRelated = false;
        dialog.close();
        this.selectBurial(this.selectedBurial);
      });
  }

  disassociateDeseased(dialog, person, type) {
    this.removeDeceased = person;
    this.removalType = type;
    this.dialogService.open(
      dialog, {
        context: 'Are you sure you\'d like to remove this person from this burial record?',
        closeOnBackdropClick: false,
      });
  }

  // actually remove the deceased connection
  confirmRemoveConnection(dialog) {
    // console.log('remove: ', this.removeDeceased, this.selectedBurial, this.removalType);
    const saveFeature = < any > {
      ...this.selectedBurial,
    };
    if (this.removalType === 'representative') {
      this.selectedBurial.reppid = 0;
      saveFeature.reppid = 0;
    } else if (this.removalType === 'burial') {
      this.selectedBurial.pidno = null;
      saveFeature.pidno = 0;
    }
    this.removingRelated = true;
    // console.log('saveFeature ', saveFeature);
    this.featureDataService.save(
      saveFeature,
      this.mapService.burialTable.url).then(relSaveResults => {
      // console.log('saved relationship! ', relSaveResults);
      this.removingRelated = false;
      dialog.close();
      this.selectBurial(this.selectedBurial);
    });
  }

}
