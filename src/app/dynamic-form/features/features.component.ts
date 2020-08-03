import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FieldsBase } from './dynamic-form/fields-base';
import { FieldsControlService } from './dynamic-form/fields-control.service';
import { FeaturedataService } from './featuredata.service';
import { DropdownField } from './dynamic-form/dropdown-field';
import { TextboxField } from './dynamic-form/textbox-field';
import { NumberField } from './dynamic-form/number-field';
import { DateField } from './dynamic-form/date-field';
import esri = __esri;
import { loadModules } from 'esri-loader';
import { ConfigService } from '../../@core/services/config.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ngx-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
  providers: [FieldsControlService],
})
export class FeaturesComponent implements OnInit, OnChanges, OnDestroy {

  @Output() cancel = new EventEmitter();
  @Output() saveComplete = new EventEmitter();
  @Input() featureData: any;
  public mapFeaturesSub: Subscription;
  public deleteFeaturesSub: Subscription;
  public newGeometryAvailable: Subscription;
  public readOnlySub: Subscription;
  public fields: FieldsBase<any>[] = [];
  public featureUrl: String;
  public saving: Boolean = false;
  public deleting = false;
  public form: FormGroup;
  public formEnabled: boolean = false;
  public timeZoneOffset = 0;
  public esriNumFieldTypes: Array<string> = [
    'esriFieldTypeInteger',
    'esriFieldTypeSmallInteger',
    'esriFieldTypeDouble',
  ];
  public relatedTable: any;
  // public featureData: any;
  dateFields: Array<string> = [];

  public burialCount: String = '';
  public salesCount: String = '';
  firstLayer: esri.FeatureLayer;
  oidField: string;
  selFeatureNum: number;
  public hasAttachments = false;
  public attachments: Array<any> = [];
  selFeature: esri.Graphic;

  // upload formdata
  formData: FormData;
  dragOver: boolean;
  uploading = false;
  editState = 'Edit Geometry';
  updatedGeometry: esri.Geometry;
  initialGeometry: esri.Geometry;
  originalPidno: string = '';

  constructor(private featureDataService: FeaturedataService,
    private fieldsControlService: FieldsControlService,
    private datePipe: DatePipe,
    private config: ConfigService) {
  }

  ngOnInit() {
    // console.log('here ngoninit features component');
    this.readOnlySub = this.featureDataService.readOnlyToggle$.subscribe(
      (checked) => {
        // console.log('readOnlyToggle: ', checked);
        if (checked) {
          this.form.enable();
          // this.formEnabled = false;
        } else if (!checked) {
          this.form.disable();
          // this.formEnabled = true;
        } else {
          console.log('unexpected value from checkbox');
        }
      },
  );
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log(changes.featureData.currentValue[0]);
    // console.log(this.featureData);
    this.initForm(0);
  }

  private initForm(index) {
    if (this.form != null) {
      this.form.reset();
      this.fields = [];
    }
    // console.log('this.featureData ', this.featureData);
    this.selFeatureNum = index + 1;

    const firstFeature = this.featureData[index];
    this.selFeature = firstFeature;
    this.firstLayer = this.featureData[index].sourceLayer;
    const popupInfo = this.firstLayer.popupTemplate.fieldInfos;
    this.initFields(popupInfo, this.firstLayer.fields, firstFeature.attributes, false);
    if (this.featureData[index].additionalData != null) {
      // console.log('add additional fields to the form: ', this.featureData[index].additionalData);
      if (this.isEmptyObject(this.featureData[index].additionalData.attributes) !== true) {
        this.originalPidno = this.featureData[index].additionalData.attributes.pidno;
      }
      this.initFields(this.featureData[index].additionalData.popupTemplate.fieldInfos,
        this.featureData[index].additionalData.fields, this.featureData[index].additionalData.attributes, true);
    }
    this.form = this.fieldsControlService.toFormGroup(this.fields);
    if (this.firstLayer.title === this.config.get('graveSitesLayerName')) {
      this.form.disable();
    }
  }

  private initFields(popupInfo, fields, attributes, extraFields) {
    // console.log(popupInfo, fields, attributes);
    // console.log('popup ', popupInfo);
    // console.log('fields: ', fields);
    // console.log('attributes: ', attributes);
    // clear the previous geometry
    this.updatedGeometry = null;
    fields.forEach(oneField => {
      // console.log('each raw field: ', attributes[oneField.name], oneField.type);
      if (oneField.type === 'esriFieldTypeOID' || oneField.type === 'oid') {
        let oid = null;
        if (attributes.hasOwnProperty(oneField.name)) {
          oid = attributes[oneField.name];
        }
        // add the OBJECTID field so the record can be saved
        this.fields.push(new TextboxField({
          key: oneField.alias,
          label: oneField.name,
          value: oid,
          required: false,
          hidden: true,
        }));
        // set the oid field name for later use with other functions
        this.oidField = oneField.name;
      }
    });
    // loop through the popup fields and construct the data entry form
    popupInfo.forEach(field => {
      // console.log('field name ', field.fieldName);
      // console.log('attributes ', attributes);
      // check to make sure the field isn't being excluded from the form
      let excludeField = false;
      if (this.config.get('excludeContactTableFields').indexOf(field.fieldName) >= 0 && extraFields === true) {
        excludeField = true;
        // console.log('Index: ', this.config.get('excludeContactTableFields').indexOf(field.fieldName), ' Extra: ', extraFields);
      }
      // console.log('exclude field: ', excludeField);
      if (field.isEditable === true && field.visible === true && excludeField === false) {
        const fieldInfo = fields.filter(item => item.name === field.fieldName)[0];
        // console.log('fieldInfo', fieldInfo);
        if (fieldInfo) {
          // console.log('field: ', field.fieldName, field.label, extraFields);
          // console.log('fieldInfo', fieldInfo);
          if ((fieldInfo.type === 'string' || fieldInfo.type === 'esriFieldTypeString') && fieldInfo.domain == null) {
            this.fields.push(new TextboxField({
              key: field.fieldName,
              label: field.label,
              value: attributes[field.fieldName] != null ? attributes[field.fieldName] : '',
              required: !fieldInfo.nullable,
              type: 'text',
              length: fieldInfo.length,
            }));
          } else if ((fieldInfo.type === 'string' || fieldInfo.type === 'esriFieldTypeString') && fieldInfo.domain != null) {
            // sort the drop down options
            const dropDownOptions = this._sortByName([...fieldInfo.domain.codedValues]).map(a => ({ value: a.code, label: a.name }));
            this.fields.push(new DropdownField({
              key: field.fieldName,
              label: field.label,
              value: attributes[fieldInfo.name] != null ? attributes[fieldInfo.name] : '',
              required: !fieldInfo.nullable,
              options: dropDownOptions,
            }));
          } else if (fieldInfo.type === 'date' || fieldInfo.type === 'esriFieldTypeDate') {
            // console.log('date: ', this.convertToDate(attributes[fieldInfo.name]));
            this.fields.push(new DateField({
              key: field.fieldName,
              label: field.label,
              value: this.convertToDate(attributes[fieldInfo.name]),
              required: !fieldInfo.nullable,
            }));
            // add date fields to an array for later processing back to ArcGIS Dates
            this.dateFields.push(fieldInfo.name);
          } else if ((fieldInfo.type === 'small-integer' || fieldInfo.type === 'integer' ||
            fieldInfo.type === 'esriFieldTypeInteger') && fieldInfo.domain != null) {
            // sort the drop down options
            // console.log(fieldInfo.domain);
            let dropDownOptions = this._sortByName([...fieldInfo.domain.codedValues]).map(a => (
              { value: a.code, label: a.name }));
            dropDownOptions = this.convertToString(dropDownOptions);
            // console.log('dropDownOptions ', dropDownOptions);
            // console.log(attributes);
            // console.log(field);
            // console.log(typeof attributes[fieldInfo.name], attributes[fieldInfo.name]);
            this.fields.push(new DropdownField({
              key: field.fieldName,
              label: field.label,
              value: attributes[fieldInfo.name] != null ? attributes[fieldInfo.name].toString() : null,
              required: !fieldInfo.nullable,
              options: dropDownOptions,
            }));
            // console.log(this.fields);
          } else if ((fieldInfo.type === 'integer' || fieldInfo.type === 'double' ||
            fieldInfo.type === 'small-integer' || fieldInfo.type === 'esriFieldTypeInteger')
            && fieldInfo.domain == null) {
            this.fields.push(new NumberField({
              key: field.fieldName,
              label: field.label,
              value: attributes[field.fieldName] != null ? attributes[field.fieldName] : '',
              required: !fieldInfo.nullable,
              type: 'number',
              length: fieldInfo.length,
            }));
          }
        }
      }
    });
    try {
      this.featureData.attributes.Location;
      this.form.disable();
    } catch (e) { }
  }

  private getAttachments(firstFeature) {
    this.featureDataService.getAttachments(firstFeature.sourceLayer, [firstFeature.attributes[this.oidField]]).then(attachments => {
      // console.log(attachments);
      if (Object.keys(attachments).length !== 0) {
        this.attachments = attachments[firstFeature.attributes[this.oidField]];
        // add the deleting attibute to the attachments
        this.attachments.forEach(attachment => {
          attachment.deleting = false;
        });
      } else {
        this.attachments = [];
      }
    });
  }

  private convertToString(list) {
    // let formattedList;
    list.forEach(item => {
      // console.log('item ', item);
      if (item.value != null) {
        item.value = item.value.toString();
      }
    });
    return list;
  }

  // TODO: separate this out to a service for reuse
  async save() {
    loadModules([
      'esri/Graphic',
      'esri/request',
    ]).then(async ([
      Graphic,
      esriRequest,
    ]) => {
      const self = this;
      // console.log('save: ', self.featureData[0]);
      // convert the dates to ArcGIS dates
      for (const key in this.form.value) {
        if (this.dateFields.indexOf(key) >= 0) {
          this.form.value[key] = Date.parse(this.form.value[key]);
        }
      }
      this.saving = true;
      // console.log('the save feature: ', this.form.value);
      const updateFeature = new Graphic({
        attributes: this.form.value,
      });
      // console.log('self.featureData[0] ', self.featureData[0]);
      // depending on the data type and edit type save the data back to the feature service
      if (self.featureData[0].type === 'table' && self.featureData[0].editType === 'update') {
        if (this.featureData[0].additionalData != null) {
          const saveObject = {};
          let numberOfUniqueValues = 0;
          for (const key in self.form.value) {
            if (self.form.value.hasOwnProperty(key)) {
              if (this.config.get('excludeContactTableFields').indexOf(key) < 0) {
                saveObject[key] = self.form.value[key];
                // console.log('key: ', key);
                if (key !== this.config.get('peopleObjectIdField')) {
                  delete self.form.value[key];
                }
              }
              if (key === 'pidno' && this.originalPidno !== self.form.value[key]) {
                const uniqValue = await <any>self.featureDataService.checkIfUniqueValue(this.featureData[0].additionalData.url,
                  self.form.value[key]);
                numberOfUniqueValues = uniqValue.uniqueIds.length;
                // console.log('number of unique values: ', uniqValue.uniqueIds.length);
              }
              // console.log(key, self.form.value[key]);
            }
          }
          if (numberOfUniqueValues > 0) {
            alert('pidno entered already exists in the database please try another number.');
            self.saving = false;
            return;
          } else {
            // the pidno and OBJECTID to the extra table so the contact name and the contact information will be connected
            saveObject['pidno'] = self.form.value.pidno;
            saveObject['name'] = self.form.value.name;
            saveObject['surname'] = self.form.value.surname;
            self.form.value[this.config.get('peopleObjectIdField')] =
              this.featureData[0].attributes[this.config.get('peopleObjectIdField')];
            // save both objects to their respective tables
            console.log('extra table save: ', saveObject);
            console.log('main table save: ', self.form.value);
            // console.log('main objectid ', this.featureData[0].attributes[this.config.get('peopleObjectIdField')]);
            self.featureDataService.save(saveObject, this.featureData[0].additionalData.url).then(updateResults => {
              console.log('extra table results ', updateResults);
              // set the date values back to strings
              // for (const key in self.form.value) {
              //   if (self.dateFields.indexOf(key) >= 0) {
              //     self.form.value[key] = self.convertToDate(self.form.value[key]);
              //   }
              // }
              // then save the main table
              self.savePrimaryTableDataUpdate();
            });
          }
          // self.saving = false;
        } else {
          // if there is no extra data then save the form like normal
          self.savePrimaryTableDataUpdate();
        }
      } else if (self.featureData[0].type === 'feature' && self.featureData[0].editType === 'update') {
        self.firstLayer.applyEdits({ updateFeatures: [updateFeature] }).then(result => {
          // console.log(result);
          self.saving = false;
          const saveResult = <any>result;

          // set the date values back to strings
          for (const key in self.form.value) {
            if (self.dateFields.indexOf(key) >= 0) {
              self.form.value[key] = self.convertToDate(self.form.value[key]);
            }
          }
        });

        // emit the saved successful event
        self.saveComplete.emit({
          data: self.form.value,
          type: 'update',
        });
      } else if (self.featureData[0].type === 'table' && self.featureData[0].editType === 'add') {
        if (self.form.value.hasOwnProperty('OBJECTID')) {
          delete self.form.value.OBJECTID;
        }
        // loop through the values and split in two if additional data exists in the form object
        // console.log('save: ', self.form.value);
        // console.log('original data: ', this.featureData[0].additionalData);
        if (this.featureData[0].additionalData != null) {
          const saveObject = {};
          let numberOfUniqueValues = 0;
          for (const key in self.form.value) {
            if (self.form.value.hasOwnProperty(key)) {
              if (this.config.get('excludeContactTableFields').indexOf(key) < 0) {
                saveObject[key] = self.form.value[key];
                delete self.form.value[key];
              }
              if (key === 'pidno') {
                // const uniqValue = await <any>self.featureDataService.checkIfUniqueValue(this.featureData[0].additionalData.url,
                //   self.form.value[key]);
                // numberOfUniqueValues = uniqValue.uniqueIds.length;
                // console.log('number of unique values: ', uniqValue.uniqueIds.length);
              }
              // console.log(key, self.form.value[key]);
            }
          }
          if (numberOfUniqueValues > 0) {
            alert('pidno entered already exists in the database please try another number.');
            self.saving = false;
            return;
          } else {
            // the pidno to the extra table so the contact name and the contact information will be connected
            // also add the name and surname
            saveObject['pidno'] = self.form.value.pidno;
            saveObject['name'] = self.form.value.name;
            saveObject['surname'] = self.form.value.surname;
            // save both objects to their respective tables
            console.log('extra table save: ', saveObject);
            console.log('main table save: ', self.form.value);
            self.featureDataService.add(saveObject, this.featureData[0].additionalData.url).then(addResults => {
              console.log('extra table results ', addResults);
              // then save the main table
              self.savePrimaryTableDataAdd();
            });
          }
          // self.saving = false;
        } else {
          // if there is no extra data then save the form like normal
          self.savePrimaryTableDataAdd();
        }
      }
    });
  }

  // TODO: these two functions are very similar and we may want to consider consolidating them into one
  savePrimaryTableDataAdd() {
    const self = this;
    // if this is a new related record then lets add the id's to the relatship table
    // console.log(self.featureData[0]);
    // console.log(self.featureData[0].hasOwnProperty('relatedGlobalID'));
    if (self.featureData[0].hasOwnProperty('relatedGlobalID') && self.featureData[0].relatedGlobalID.type === 'Burial' &&
      self.featureData[0].relatedGlobalID.from == null) {
      self.form.value.pidno = self.featureData[0].relatedGlobalID.id;
    }
    // if creating a new sales record from the gravesite tab
    if (self.featureData[0].hasOwnProperty('relatedGlobalID') && self.featureData[0].relatedGlobalID.type === 'Sales' &&
      self.featureData[0].relatedGlobalID.from === 'Gravesites') {
      self.form.value.GraveID = self.featureData[0].relatedGlobalID.id;
    }
    // console.log('add: ', self.form.value);
    // console.log('url: ', self.firstLayer.url);
    self.featureDataService.add(self.form.value, self.firstLayer.url).then(async addResults => {
      // set the date values back to strings
      for (const key in self.form.value) {
        if (self.dateFields.indexOf(key) >= 0) {
          self.form.value[key] = self.convertToDate(self.form.value[key]);
        }
      }

      // emit save successful
      self.saving = false;
      const saveResult = <any>addResults;
      // console.log('save new results: ', saveResult);
      // add the object id to the form so the values can be edited when re-clicking on the record
      self.form.value.OBJECTID = saveResult.addResults[0].objectId;
      self.form.patchValue({
        OBJECTID: saveResult.addResults[0].objectId,
      });
      // self.form.value.GlobalID = saveResult.addResults[0].globalId;
      // self.form.patchValue({
      //   GlobalID: saveResult.addResults[0].globalId,
      // });

      // if this is a new related record then lets add the id's to the relatship table
      if (self.featureData[0].hasOwnProperty('relatedGlobalID')) {
        console.log('self.featureData[0].relatedGlobalID: ', self.featureData[0].relatedGlobalID);
        console.log('save results before adding related record: ', saveResult);
        // save related sales data
        // Add the related information to the connection table if adding a new sales record from the owner table
        if (self.featureData[0].relatedGlobalID.type === 'Sales' && self.featureData[0].relatedGlobalID.from == null) {
          const relSaveResults = await self.featureDataService.addPeopleRelationshipRecord(
            this.config.get('SalesToOwnerRelTable' + environment.webmapSwitch),
            self.featureData[0].relatedGlobalID.id, saveResult.addResults[0].globalId);
          console.log('saved relationship! ', relSaveResults);
          self.emitSaveSuccessful(saveResult.addResults[0].globalId);
        }
        // Add the related information to the connection table if adding a new owner record from the sales table
        if (self.featureData[0].relatedGlobalID.type === 'Owner' && self.featureData[0].relatedGlobalID.from == null) {
          const relSaveResults = await self.featureDataService.addPeopleRelationshipRecord(
            this.config.get('SalesToOwnerRelTable' + environment.webmapSwitch),
            saveResult.addResults[0].globalId, self.featureData[0].relatedGlobalID.id);
          console.log('saved relationship! ', relSaveResults);
          self.emitSaveSuccessful(saveResult.addResults[0].globalId);
        }
        // Add the related information to the burial gravesite connection table
        if (self.featureData[0].relatedGlobalID.type === 'Burial' && self.featureData[0].relatedGlobalID.from === 'Gravesites') {
          const relSaveResults = await self.featureDataService.addBurialRelationshipRecord(
            this.config.get('GravesitesToBurials' + environment.webmapSwitch),
            saveResult.addResults[0].globalId, self.featureData[0].relatedGlobalID.id);
          console.log('saved burial/grave relationship! ', relSaveResults);
          self.emitSaveSuccessful(saveResult.addResults[0].globalId);
        }
        // account for saving new sales records - pretty hackish.... but in the interest of time it'll work
        if (self.featureData[0].relatedGlobalID.type === 'Sales' && self.featureData[0].relatedGlobalID.from === 'Gravesites') {
          self.emitSaveSuccessful(saveResult.addResults[0].globalId);
        } else if (self.featureData[0].relatedGlobalID.type === 'Deceased') {
          self.emitSaveSuccessful(saveResult.addResults[0].globalId);
        }
      } else {
        self.emitSaveSuccessful(saveResult.addResults[0].globalId);
      }
    });
  }

  savePrimaryTableDataUpdate() {
    const self = this;
    // console.log('before update OBJECTID: ', self.form.value.OBJECTID);
    self.featureDataService.save(self.form.value, self.firstLayer.url).then(updateResults => {
      // set the date values back to strings
      for (const key in self.form.value) {
        if (self.dateFields.indexOf(key) >= 0) {
          self.form.value[key] = self.convertToDate(self.form.value[key]);
        }
      }

      // emit save successful
      self.saving = false;
      const saveResult = <any>updateResults;
      // console.log('primary update: ', saveResult);
      // emit the saved successful event
      self.saveComplete.emit({
        data: self.form.value,
        type: 'update',
      });
    });
  }

  // emit the saved successful event
  private emitSaveSuccessful(globalId) {
    this.saveComplete.emit({
      data: {...this.form.value},
      type: 'add',
      globalId: globalId,
    });
  }

  delete() {
    const self = this;
    this.deleting = true;
    // console.log('delete this features OID: ', this.form.value[this.oidField]);
    // console.log(self.firstLayer.title);
    self.firstLayer.applyEdits({ deleteFeatures: [{ objectId: this.form.value[this.oidField] }] }).then(result => {
      // console.log('delete done: ', result);
      self.deleting = false;
      this.editState = 'Edit Geometry';
      // close the panel
      // self.hidePanel.emit();
    });
  }

  selectNextFeature(direction) {
    // console.log('select next ', this.selFeatureNum, this.featureData.length);
    if (this.selFeatureNum >= 1 && this.selFeatureNum < this.featureData.length) {
      // console.log('select next ', this.selFeatureNum, direction, this.featureData.length);
      if (direction === 'forward') {
        // select the next feature
        this.initForm(this.selFeatureNum);
        // this.selFeatureNum = this.selFeatureNum + 1;
      } else if (direction === 'backward') {
        if (this.selFeatureNum !== 1) {
          // select the next feature
          this.initForm(this.selFeatureNum - 2);
        }
        // this.selFeatureNum = this.selFeatureNum - 1;
      }
    } else if (this.selFeatureNum === this.featureData.length && direction === 'backward') {
      // select the next feature
      this.initForm(this.selFeatureNum - 2);
    }
  }

  deleteAttachments(attachment) {
    attachment.deleting = true;
    const self = this;
    this.firstLayer.deleteAttachments(this.selFeature, [attachment.id]).then(result => {
      if (result[0].error != null) {
        // this.toast.error('', 'Can not delete this attachment.', { toastClass: 'opacity' });
      } else {
        self.attachments = self.attachments.filter(x => x.id !== attachment.id);
      }
    });
  }

  addAttachments(attachment) {
    const self = this;
    this.firstLayer.addAttachment(this.selFeature, attachment).then(result => {
      self.getAttachments(self.selFeature);
      self.uploading = false;
    });
  }

  // edit the selected geometry using the sketchViewModel
  // editGeometry() {
  //   // console.log('edit this geometry: ', this.selFeature);
  //   const fLayer = <esri.FeatureLayer>this.selFeature.layer;
  //   // get the feature layer view so we can query the nearest feature for snapping
  //   const editFLayerView = this.mapService.featureLayerViews.filter(item => item.layer.title === fLayer.title)[0];
  //   if (this.editState === 'Edit Geometry') {
  //     this.editState = 'Cancel Edit';
  //     this.mapService.clearSelectedFeatures();
  //     this.getFullFeatureGeometry(this.selFeature).then(async features => {
  //       const fullFeatures = <any>features;
  //       if (fullFeatures.features.length > 0) {
  //         // console.log(fullFeatures.features[0].geometry);
  //         fLayer.definitionExpression = this.oidField + ' <> ' + this.selFeature.attributes[this.oidField];
  //         // console.log(this.selFeature.geometry);
  //         this.selFeature.geometry = fullFeatures.features[0].geometry;
  //         this.mapDrawService.startReshapeGeometry(this.selFeature, editFLayerView);
  //         this.mapDrawService.drawActive = true;
  //       } else {
  //         this.toast.error('Error getting feature geometry', 'Error: ', { toastClass: 'opacity'});
  //       }
  //     });
  //   } else if (this.editState === 'Cancel Edit') {
  //     this.editState = 'Edit Geometry';
  //     this.mapDrawService.cancelEditing();
  //     fLayer.definitionExpression = '';
  //     this.mapDrawService.drawActive = false;
  //   }
  // }

  // getFullFeatureGeometry(feature) {
  //   return this.tableFunctions.getFeatureData(
  //     feature.layer.url + '/' + feature.layer.layerId, this.oidField + ' = ' + feature.attributes[this.oidField]);
  // }

  _sortByName(codedValues) {
    // add a blank option
    codedValues.push({ name: 'Clear', code: null });
    return codedValues.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  formatDate(date): number {
    if (date) {
      date.setMinutes(date.getMinutes() + this.timeZoneOffset);
      return date.getTime();
    } else {
      return null;
    }
  }

  convertToDate(inDateNum: number): Date {
    if (inDateNum) {
      // return this.datePipe.transform(this._dateFromArcGIS(inDateNum), 'MM/dd/yyyy');
      const localDate = this._dateFromArcGIS(inDateNum);
      // return this._dateFromArcGIS(inDateNum);
      return new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
    } else {
      return null;
    }
  }

  _dateFromArcGIS(utcDate): Date {
    const d = new Date(utcDate);
    return d;
  }

  cancelClick() {
    this.cancel.emit();
  }

  // helper
  isEmptyObject(obj) {
    return (obj && (Object.keys(obj).length === 0));
  }

  ngOnDestroy() {
    // console.log('ngOnDestroy');
    this.readOnlySub.unsubscribe();
    // this.mapFeaturesSub.unsubscribe();
    // this.deleteFeaturesSub.unsubscribe();
    // this.newGeometryAvailable.unsubscribe();
    this.attachments = [];
  }

}
