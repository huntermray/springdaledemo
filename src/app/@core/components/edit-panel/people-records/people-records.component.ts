import { RelatedRecords } from './../../../classes/related-records';
import { ConfigService } from './../../../services/config.service';
import { MapService } from './../../../../pages/dashboard/map/map.service';
import { Component, OnInit, Output, EventEmitter, TemplateRef, SimpleChanges, OnChanges, Input } from '@angular/core';
import { ArcgisService } from '../../../services/arcgis.service';
import { NbDialogService } from '@nebular/theme';
import { promise } from 'selenium-webdriver';
import { resolve } from 'url';

@Component({
  selector: 'ngx-people-records',
  templateUrl: './people-records.component.html',
  styleUrls: ['./people-records.component.scss'],
})
export class PeopleRecordsComponent implements OnInit, OnChanges {

  @Output() navigate = new EventEmitter();
  @Input() data: any;
  // personsName: object = {
  //   FName: '',
  //   LName: '',
  // };
  personFName: string = '';
  personLName: string = '';
  pid: string = '';
  numPeople: number = 0;
  searching: boolean = false;
  allPeople: Array<any> = [];
  numBurial: number = 0;
  numSales: number = 0;
  numGraveSites: number = 0;
  personClicked: boolean = false;
  editClicked: boolean = false;
  deleting: boolean = false;
  selectedPerson: any = '';
  selDeleteSale: any;
  selDeleteburial: any;
  dataAvailable: boolean = false;
  formData = [{}];
  selectedOption: string = 'owner';
  tableDataLookUp = {
    owner: 'OwnerTable',
    representative: 'RepresentativeTable',
    deceased: 'DeceasedTable',
  };
  p2: number = 1;
  peopleFound: boolean = true;
  loading: boolean = true;
  serviceNo: string;
  loaded: boolean = true;

  constructor(
    public arcgisService: ArcgisService,
    private mapService: MapService,
    private config: ConfigService,
    private dialogService: NbDialogService) { }

  ngOnInit() {
    // turn on searching after the map is loaded
    this.mapService.mapLoaded$.subscribe(() => {
      const self = this;
      self.loaded = false;
    });
    this.serviceNo = this.config.get('burialSearchResults');
  }

  // Radio Button change listener
  OnRadioChange(evt) {
    // console.log(evt);
    this.clearResults();
    return this.selectedOption;
  }

  async searchByName() {
    this.clearResults('name');
    const selectedOption = this.selectedOption;
    this.personClicked = false;
    this.editClicked = false;
    if (this.personFName.length >= 2 || this.personLName.length >= 2) {
      this.searching = true;
      this.pid = '';
      let peopleResults;
      const names = {
        LName: this.personLName,
        FName: this.personFName,
      };
      try {
        peopleResults = <any>await this.arcgisService.userParameterSearch(names, selectedOption);
      } catch (error) {
        this.searching = false;
        alert('Error querying the people table.  ' + error.message);
      }
      // console.log(peopleResults);
      this.allPeople = peopleResults.features.map(a => (a.attributes));
      // TODO: This should be a function
      if (selectedOption === 'deceased') {
        const peopleObjectIds = [];
        this.allPeople.forEach(person => {
          peopleObjectIds.push(person.OBJECTID);
        });
        const relatedContacts = await this.getRelatedRecords(peopleObjectIds);
        let personContact;
        this.allPeople.forEach(person => {
          personContact = relatedContacts.filter(contact => contact.pidno === person.pidno);
          if (personContact[0].dod != null) {
            const dodTime = new Date(personContact[0].dod).getTime();
            const dodDate = new Date(dodTime);
            person.dod = this.arcgisService.formatDate(dodDate);
          } else {
            person.dod = null;
          }
          let displayString = this.config.get('ownerSearchResults');
          for (const key in person) {
            if (person.hasOwnProperty(key)) {
              displayString = displayString.replace(key, person[key]);
            }
          }
          person.display = displayString;
        });
      } else {
        this.allPeople.forEach(person => {
          let displayString = this.config.get('ownerSearchResults');
          for (const key in person) {
            if (person.hasOwnProperty(key)) {
              displayString = displayString.replace(key, person[key]);
              // displayString += this.getRelatedRecords(person.GlobalID);
              // console.log('Display String: ', displayString);
            }
          }
          person.display = displayString;
        });
      }
      this.allPeople = this._sortByName(this.allPeople);
      this.numPeople = peopleResults.features.length;
      // this.addDisplayValue();
      this.searching = false;
      // if (this.selectedOption === 'deceased') {
      //   this.getRelatedRecords(this.allPeople);
      // }
      if (this.numPeople === 0) {
        this.peopleFound = false;
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

  async searchByPID() {
    const selectedOption = this.selectedOption;
    this.personClicked = false;
    if (this.pid.length >= 1) {
      this.clearResults('pid');
      this.searching = true;
      this.personLName = '';
      this.personFName = '';
      this.selectedOption = selectedOption;
      const peopleResults = <any>await this.arcgisService.userParameterSearch(this.pid, selectedOption + 'PID');
      this.allPeople = peopleResults.features.map(a => (a.attributes));
      // if there are no results let the user know
      if (this.allPeople.length === 0) {
        this.searching = false;
        alert('No results found!');
        return;
      }
      if (selectedOption === 'deceased') {
        const peopleObjectIds = [];
        this.allPeople.forEach(person => {
          peopleObjectIds.push(person.OBJECTID);
        });
        const relatedContacts = await this.getRelatedRecords(peopleObjectIds);
        let personContact;
        this.allPeople.forEach(person => {
          personContact = relatedContacts.filter(contact => contact.pidno === person.pidno);
          if (personContact[0].dod != null) {
            const dodTime = new Date(personContact[0].dod).getTime();
            const dodDate = new Date(dodTime);
            person.dod = this.arcgisService.formatDate(dodDate);
          } else {
            person.dod = null;
          }
          let displayString = this.config.get('ownerSearchResults');
          for (const key in person) {
            if (person.hasOwnProperty(key)) {
              displayString = displayString.replace(key, person[key]);
            }
          }
          person.display = displayString;
        });
      } else {
        this.allPeople.forEach(person => {
          let displayString = this.config.get('ownerSearchResults');
          for (const key in person) {
            if (person.hasOwnProperty(key)) {
              displayString = displayString.replace(key, person[key]);
              // displayString += this.getRelatedRecords(person.GlobalID);
              // console.log('Display String: ', displayString);
            }
          }
          person.display = displayString;
        });
      }
      this.allPeople = this._sortByName(this.allPeople);
      this.numPeople = peopleResults.features.length;
      this.searching = false;
      if (this.allPeople.length === 0) {
        this.peopleFound = false;
        console.log('No Search Results', this.peopleFound);
      }
    } else {
      this.searchByName();
      // this.clearResults();
      // this.allPeople = [];
      // this.formData = [];
      // this.arcgisService.clearData();
    }
  }

  addDisplayValue() {
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
  }

  async getRelatedRecords(objIds) {
    // TODO: Change out the hardcoded [1]
    const selPeopleTable = this.mapService.peopleTables['deceased'];
    const relId = selPeopleTable.relationships[1].id;
    const relName = selPeopleTable.relationships[1].name;
    const relatedRecords = await <any>this.arcgisService.getRelatedTableData(selPeopleTable.url, objIds, relId, relName);
    const relatedContacts = [];
    relatedRecords.results.relatedRecordGroups.forEach(record => {
      relatedContacts.push(record.relatedRecords[0].attributes);
    });
    return relatedContacts;
  }

  async selectPerson(person) {
    this.loading = true;
    this.personClicked = true;
    this.selectedPerson = person;
    this.personLName = person.surname;
    // find the object id field first
    const oidField = this.mapService.contactTable.fields.filter(x => x.type === 'esriFieldTypeOID')[0];
    // get all of the related records
    const allRelationshipQueries = [];
    // selected people table option
    const selPeopleTable = this.mapService.peopleTables[this.selectedOption];
    // console.log(this.mapService.peopleTables[this.selectedOption].relationships);
    selPeopleTable.relationships.forEach(relationship => {
      allRelationshipQueries.push(
        this.arcgisService.getRelatedTableData(
          selPeopleTable.url, [person[oidField.name]], relationship.id, relationship.name),
      );
    });
    Promise.all(allRelationshipQueries).then(allResults => {
      // console.log('All related records: ', allResults);
      // show the related sales records
      // console.log(this.arcgisService.data.ContactTable);
      // console.log('person data', person);
      if (this.arcgisService.data.SalesRecords.length === 0) {
        this.numSales = 0;
      } else {
        this.numSales = this.arcgisService.data.SalesRecords.length;
        // update the display values
        this.addSalesDisplayValue();
      }

      // show the related burial records
      // console.log(this.arcgisService.data.BurialRecords);
      if (this.arcgisService.data.BurialRecords.length === 0) {
        this.numBurial = 0;
      } else {
        this.numBurial = this.arcgisService.data.BurialRecords.length;
      }
      this.loading = false;
      // // get the related grave site records
      // const graveRecords = allResults.filter(x => x.name === this.config.get('toGravesitesRelationship'))[0];
      // // console.log(graveRecords.results);
      // if (graveRecords.results.relatedRecordGroups.length === 0) {
      //   this.numGraveSites = 0;
      // } else {
      //   this.numGraveSites = graveRecords.results.relatedRecordGroups[0].relatedRecords.length;
      // }
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    // console.log(changes.data.currentValue);
    if (changes.data.currentValue != null && this.tableDataLookUp[changes.data.currentValue.type] != null) {
      // console.log('People: ', changes.data.currentValue.relatedGlobalID);
      // console.log('people records: ', changes.data.currentValue);
      // set the search type
      this.selectedOption = changes.data.currentValue.type;
      this.dataAvailable = true;
      const selPerson = changes.data.currentValue[this.tableDataLookUp[changes.data.currentValue.type]];
      // console.log('selPerson ', selPerson);
      if (this.isEmptyObject(selPerson) === true) {
        const burialPIDMax = <number> await this.arcgisService.getMaxValue(this.mapService.burialTable.url, 'pidno');
        const deceasedMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.deceased.url, 'pidno');
        const ownerMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.owner.url, 'pidno');
        const repMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.representative.url, 'pidno');
        const contactMax = <number> await this.arcgisService.getMaxValue(this.mapService.contactTable.url, 'pidno');
        const truePIDMax = Math.max(burialPIDMax, deceasedMax, ownerMax, repMax, contactMax);
        selPerson.pidno = truePIDMax + 1;
        this.formData = [{
          attributes: selPerson,
          sourceLayer: {
            popupTemplate: this.mapService.contactTable.popupInfo,
            fields: this.mapService.contactTable.fields,
            url: this.mapService.contactTable.url,
          },
          type: 'table',
          editType: 'add',
          relatedGlobalID: {
            id: changes.data.currentValue.relatedGlobalID,
            type: 'Sales',
          },
          additionalData: {
            popupTemplate: this.mapService.contactTable.popupInfo,
            fields: this.mapService.contactTable.fields,
            url: this.mapService.contactTable.url,
            attributes: {},
          },
        }];
      } else {
        this.formData = [{
          attributes: selPerson,
          sourceLayer: {
            popupTemplate: this.mapService.contactTable.popupInfo,
            fields: this.mapService.contactTable.fields,
            url: this.mapService.contactTable.url,
          },
          type: 'table',
          editType: 'update',
        }];
        // select the correct person and related records

        this.personFName = selPerson.Name;
        this.selectPerson(selPerson);
      }
    } else if (changes.data.currentValue != null && changes.data.currentValue.editClicked === true ) {
      // add a new owner id
      const burialPIDMax = <number> await this.arcgisService.getMaxValue(this.mapService.burialTable.url, 'pidno');
      const deceasedMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.deceased.url, 'pidno');
      const ownerMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.owner.url, 'pidno');
      const repMax = <number> await this.arcgisService.getMaxValue(this.mapService.peopleTables.representative.url, 'pidno');
      const contactMax = <number> await this.arcgisService.getMaxValue(this.mapService.contactTable.url, 'pidno');
      const truePIDMax = Math.max(burialPIDMax, deceasedMax, ownerMax, repMax, contactMax);
      // console.log('changes.data ', changes.data.currentValue.peopleRecords.pidno);
      // console.log('truePIDMax ', truePIDMax);
      changes.data.currentValue.peopleRecords.pidno = truePIDMax + 1;
      this.addNewPerson(changes.data);
    }
  }

  // clicking on a specific record in the sales table to edit
  selectSale(sale) {
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'Sales',
      data: {
        SalesRecords: sale,
        SelectedPerson: this.selectedPerson,
      },
    });
    this.clearResults();
  }

  // select a burial record and show the burial editing panel
  selectBurial(burial) {
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'Burials',
      data: {
        BurialRecords: burial,
        SelectedPerson: this.selectedPerson,
      },
    });
    this.clearResults();
  }

  // select a grave record and show the grave editing panel
  // selectGrave(grave) {
  //   // passing the tab name to the type property will navigate the tab specified
  //   this.navigate.emit({
  //     type: 'Gravesites',
  //     data: {
  //       Gravesites: grave,
  //     },
  //   });
  // }

  // add a new person record
  addNewPerson(data) {
    // console.log('data ', data.currentValue);
    this.selectedOption = data.currentValue.type.toLowerCase();
    this.personClicked = true;
    this.editClicked = true;
    // show the editing panel for the selected person
    this.formData = [{
      attributes: data.currentValue.peopleRecords,
      sourceLayer: {
        popupTemplate: this.mapService.peopleTables[this.selectedOption].popupInfo,
        fields: this.mapService.peopleTables[this.selectedOption].fields,
        url: this.mapService.peopleTables[this.selectedOption].url,
      },
      type: 'table',
      editType: 'add',
      additionalData: {
        popupTemplate: this.mapService.contactTable.popupInfo,
        fields: this.mapService.contactTable.fields,
        url: this.mapService.contactTable.url,
        attributes: {},
      },
      relatedGlobalID: {
        id: data.currentValue.relatedGlobalID,
        type: data.currentValue.type,
      },
    }];
  }

  // add a new associated sales record
  addNewSale() {
    // console.log('add new sales record for this person', this.selectedPerson);
    this.navigate.emit({
      type: 'Sales',
      data: {
        SalesRecords: {},
        relatedGlobalID: this.selectedPerson.GlobalID,
      },
    });
  }

  // add a new associated burial record - Representative
  addNewBurial() {
    // console.log(this.selectedPerson);
    this.navigate.emit({
      type: 'Burials',
      data: {
        BurialRecords: {},
        relatedGlobalID: this.selectedPerson.pidno,
      },
    });
  }

  // delete a sales record
  deleteSale(dialog: TemplateRef<any>, sale) {
    this.selDeleteSale = sale;
    this.dialogService.open(
      dialog, {
        context: 'Are you sure you want to delete this record?',
        closeOnBackdropClick: false,
      });
  }

  confirmSaleDelete(dialog) {
    // console.log('actually delete now!', this.selDeleteSale);
    this.deleting = true;
    this.arcgisService.delete(this.mapService.salesTable.url, this.selDeleteSale.OBJECTID).then(deleteResults => {
      // console.log(deleteResults);
      dialog.close();
      this.deleting = false;
      // remove the record from the view model data
      this.arcgisService.setData('SalesRecords', {
        data: {
          OBJECTID: this.selDeleteSale.OBJECTID,
        },
        type: 'delete',
      });
    });
  }

  // delete a sales record
  deleteBurial(dialog: TemplateRef<any>, burial) {
    this.selDeleteburial = burial;
    this.dialogService.open(
      dialog, {
        context: 'Are you sure you want to delete this record?',
        closeOnBackdropClick: false,
      });
  }

  confirmBurialDelete(dialog) {
    // console.log('actually delete now!', this.selDeleteSale);
    this.deleting = true;
    this.arcgisService.delete(this.mapService.burialTable.url, this.selDeleteburial.OBJECTID).then(deleteResults => {
      // console.log(deleteResults);
      dialog.close();
      this.deleting = false;
      // remove the record from the view model data
      this.arcgisService.setData('BurialRecords', {
        data: {
          OBJECTID: this.selDeleteburial.OBJECTID,
        },
        type: 'delete',
      });
    });
  }

  // edit the selected person
  editPerson(edit) {
    if (this.loading === true) {
      return;
    }
    // console.log(this.selectedPerson);
    // console.log(this.selectedOption);
    this.editClicked = edit;
    // show the editing panel for the selected person
    this.formData = [{
      attributes: this.selectedPerson,
      sourceLayer: {
        popupTemplate: this.mapService.peopleTables[this.selectedOption].popupInfo,
        fields: this.mapService.peopleTables[this.selectedOption].fields,
        url: this.mapService.peopleTables[this.selectedOption].url,
      },
      type: 'table',
      editType: 'update',
      additionalData: {
        popupTemplate: this.mapService.contactTable.popupInfo,
        fields: this.mapService.contactTable.fields,
        url: this.mapService.contactTable.url,
        attributes: this.arcgisService.data.ContactTable[0],
      },
    }];
  }

  // after saving a new person add them as the selected person object
  addPersonComplete(evt) {
    if (evt.type === 'add') {
      this.selectedPerson = evt.data;
      this.selectPerson(this.selectedPerson);
    }
  }

  cancel() {
    this.personClicked = false;
    // this.allPeople = [];
    // this.numPeople = 0;
    this.editClicked = false;
    // console.log('cancel');
    this.clearResults();
  }

  // clear the people search results
  clearResults(clearOverride?) {

    switch (clearOverride) {
      case 'pid':
        this.personLName = '';
        this.personFName = '';
        break;
      case 'name':
        this.pid = '';
        break;
      default:
        this.personLName = '';
        this.personFName = '';
        this.pid = '';
        break;
    }
    this.allPeople = [];
    this.formData = [];
    this.personClicked = false;
    this.editClicked = false;
    this.selectedPerson = '';
    this.arcgisService.clearData();
  }

  // update the sales records results
  addSalesDisplayValue() {
    // set the display for the results
    this.arcgisService.data.SalesRecords.forEach(sale => {
      let displayString = this.config.get('salesSearchResults');
      for (const key in sale) {
        if (sale.hasOwnProperty(key)) {
          displayString = displayString.replace(key, sale[key]);
        }
      }
      sale.display = displayString;
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
