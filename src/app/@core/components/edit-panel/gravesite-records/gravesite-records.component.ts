import { RelatedRecords } from './../../../classes/related-records';
import { ConfigService } from './../../../services/config.service';
import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges, TemplateRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from '../../../../pages/dashboard/map/map.service';
import { ArcgisService } from '../../../services/arcgis.service';
import { FeaturedataService } from '../../../../dynamic-form/features/featuredata.service';
import { NbDialogService } from '@nebular/theme';
import esri = __esri;
import { loadModules } from 'esri-loader';

@Component({
  selector: 'ngx-gravesite-records',
  templateUrl: './gravesite-records.component.html',
  styleUrls: ['./gravesite-records.component.scss'],
})
export class GravesiteRecordsComponent implements OnInit, OnChanges, OnDestroy {

  @Output() navigate = new EventEmitter();
  @Input() data: any;
  public newFormReadySub: Subscription;
  dataAvailable: boolean = false;
  numBurial: number = 0;
  deleting: boolean = false;
  selDeleteburial: any;
  selDeleteSale: any;
  currentGrave: any;
  formData = [{}];
  isChecked: boolean = false;
  handle: any;
  sketchvm: esri.Sketch;
  draw: esri.Draw;
  editingLayer: esri.GraphicsLayer;
  sketchActive: boolean = false;
  newGraveLength: number;
  newGraveWidth: number;
  selectedPerson: any = '';
  editClicked: boolean = false;
  relatedBurials: any;
  relatedSales: any;
  serviceNo: string;
  gravesiteClickHandler: any;

  constructor(private mapService: MapService,
    public arcgisService: ArcgisService,
    private config: ConfigService,
    private featureDataService: FeaturedataService,
    private dialogService: NbDialogService) { }

  ngOnInit() {
    this.serviceNo = this.config.get('burialSearchResults');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data.currentValue != null && changes.data.currentValue.Gravesites != null) {
      // if passing in a blank gravesite clear the panel
      if (this.isEmptyObject(changes.data.currentValue.Gravesites) === true) {
        this.clearResults();
        return;
      }
      // console.log('Gravesites: ', changes.data.currentValue.Gravesites);
      this.dataAvailable = true;
      this.currentGrave = changes.data.currentValue.Gravesites;
      this.selectedPerson = changes.data.currentValue.SelectedPerson;
      this.getGraveSiteData();
    }
  }

async getGraveSiteData() {
    this.clearResults('true');
    this.dataAvailable = true;
    // console.log('You clicked a gravesite!');
    // const selGrave = this.currentGrave;
    const objectIdArr = [];
    // console.log('selected grave: ', selGrave);
    // get the objectid field from the gravesite layer
    const oidField = this.mapService.gravesiteLayer.fields.filter(x => x.type === 'oid')[0];
    // select, highlight, and zoom to the feature on the map
    objectIdArr.push(this.currentGrave[oidField.name]);
    // console.log('objectIdArr ', objectIdArr);

    // retrieve related records of related records for displaying names
    this.relatedBurials = await this.getDistantRelatedRecords(objectIdArr, 'deceased');
    // console.log('related burials: ', this.relatedBurials);
    // console.log('burials from the service: ', this.arcgisService.data.BurialRecords);
    this.relatedSales = await this.getDistantRelatedRecords(objectIdArr, 'owner');
    // console.log('related sales: ', this.relatedSales);
    // console.log('sales records from the service: ', this.arcgisService.data.SalesRecords);
    this.mapService.getFullGeometry(objectIdArr);
    this.formData = [{
      attributes: this.currentGrave,
      sourceLayer: this.mapService.gravesiteLayer,
      type: 'feature',
      editType: 'update',
    }];
    this.toggleReadOnly(false);
    // get all of the related records
    // const allRelationshipQueries = [];
    // // console.log(this.mapService.gravesiteLayer.relationships);
    // this.mapService.gravesiteLayer.relationships.forEach(relationship => {
    //   // console.log(this.mapService.gravesiteLayer.url + '/' + this.mapService.gravesiteLayer.layerId,
    //   // [oidField.name], relationship.id, relationship.name);
    //   allRelationshipQueries.push(
    //     this.arcgisService.getRelatedTableData(
    //       this.mapService.gravesiteLayer.url + '/' + this.mapService.gravesiteLayer.layerId,
    //       this.currentGrave[oidField.name], relationship.id, relationship.name),
    //   );
    // });
    // Promise.all(allRelationshipQueries).then(allResults => {
    //   // console.log('grave related records', this.arcgisService.data);
    // }).catch(err => {
    //   console.error(err);
    // });
    // select the correct burial and related records
    // this.handle = selGravesite.Handle;
    // this.selectGravesite(selGravesite);
  }

  addGravesite() {
    loadModules(['esri/widgets/Sketch/SketchViewModel', 'esri/Graphic', 'esri/geometry/Polygon', 'esri/layers/GraphicsLayer',
                 'esri/geometry/Extent', 'esri/geometry/SpatialReference', 'esri/geometry/support/webMercatorUtils'])
        .then(([SketchViewModel, Graphic, Polygon, GraphicsLayer, Extent, SpatialReference, webMercatorUtils]) => {
          this.editingLayer = new GraphicsLayer();
          this.mapService.webmap.add(this.editingLayer);
          this.sketchvm = new SketchViewModel({
            view: this.mapService.mapView,
            layer: this.editingLayer,
            defaultUpdateOptions: {
              // set the default options for the update operations
              toggleToolOnClick: false, // only reshape operation will be enabled
              enableScaling: false, // Do not allow scaling the size
            },
          });
          this.mapService.mapView.graphics.removeAll();
          // remove the default click handler and use the new gravesite handler
          this.mapService.removeClickHandler();
          const self = this;
          this.gravesiteClickHandler = this.mapService.mapView.on('click', function(event) {
            // console.log(self.editingLayer);
            if (self.editingLayer.graphics.length < 1) {
              // get the lat long of the clicked point
              const latLong = webMercatorUtils.xyToLngLat(event.mapPoint.x, event.mapPoint.y);
              // Do the bounding box calculations to create an extent rectangle
              const box = self.getBoundingBox(latLong, self.newGraveLength, self.newGraveWidth);
              const extent = new Extent(box[0], box[1], box[2], box[3], SpatialReference({
                wkid: 4326,
              }));
              // Convert to web mercator polygon from wgs84 extent
              const newGravesitePoly = Polygon.fromExtent(webMercatorUtils.geographicToWebMercator(extent));
              const newGravesiteGraphic = new Graphic({
                geometry: newGravesitePoly,
                symbol: {
                  type: 'simple-fill',
                  style: 'solid',
                  color: '#55FF00',
                  outline: {
                    color: '#6E6E6E',
                    width: 0.93,
                  },
                },
              });
              const attributes = {};
              self.mapService.gravesiteLayer.fields.forEach(function(field) {
                // console.log(field);
                attributes[field.name] = field.defaultValue;
              });
              newGravesiteGraphic.attributes = attributes;
              // console.log(newGravesiteGraphic);
              self.editingLayer.addMany([newGravesiteGraphic]);
              // console.log(self.editingLayer);
            } else {
              // Do nothing and use normal sketch view model behavior
            }
          });
          this.sketchActive = true;
          this.dataAvailable = false;
        });
  }

  editGravesite(editing) {
    this.editClicked = editing;
    // show the editing panel for the selected gravesite
    this.formData = [{
      attributes: this.currentGrave,
      sourceLayer: this.mapService.gravesiteLayer,
      type: 'feature',
      editType: 'update',
    }];
  }

  saveGravesiteEdits() {
    loadModules(['esri/tasks/support/Query'])
        .then(([Query]) => {
          const self = this;
          // console.log(this.editingLayer.graphics.pop());
          // cleanup, remove the add gravesite handler and put back the default
          this.gravesiteClickHandler.remove();
          this.gravesiteClickHandler = null;
          this.mapService.setupDefaultClickHandler();
          this.mapService.gravesiteLayer.applyEdits({
            addFeatures: [this.editingLayer.graphics.pop()],
          }).then((result) => {
            self.sketchActive = false;
            self.sketchvm.destroy();
            self.mapService.webmap.remove(self.editingLayer);
            self.editingLayer.removeAll();
            self.editingLayer = null;
            self.mapService.gravesiteLayer.refresh();
            // self.gravesiteClickHandler.remove();
            // self.gravesiteClickHandler = null;
            // self.mapService.getFullGeometry(result.addFeatureResults[0].objectId);
            const query = new Query();
            query.returnGeometry = false;
            query.objectIds = result.addFeatureResults[0].objectId;
            query.outFields = '*';
            self.mapService.gravesiteLayer.queryFeatures(query).then((response) => {
              this.currentGrave = response.features[0].attributes;
              self.getGraveSiteData();
            });
          })
          .catch((error) => {
            console.error('[ applyEdits ] FAILURE: ', error.code, error.name, error.message);
            console.log(error);
          });
        });
  }

  clearGravesiteEdits() {
    this.sketchActive = false;
    this.sketchvm.destroy();
    this.mapService.webmap.remove(this.editingLayer);
    this.editingLayer.removeAll();
    this.editingLayer = null;
    this.gravesiteClickHandler.remove();
    this.gravesiteClickHandler = null;
    this.mapService.setupDefaultClickHandler();
  }

  clearResults(clearOverride?) {
    if (this.sketchActive === true) {
      this.clearGravesiteEdits();
    }
    if (clearOverride == null) {
      this.currentGrave = null;
    }
    this.editClicked = false;
    this.formData = [];
    this.isChecked = false;
    this.numBurial = 0;
    this.handle = '';
    this.selectedPerson = '';
    this.arcgisService.clearData();
    this.dataAvailable = false;
  }

  getBoundingBox(centerPoint, length, width) {
    length = length / 2;
    width = width / 2;
    if (length < 0) {
      return 'Illegal arguments';
    }
    // coordinate limits
    const MIN_LAT = this.degToRad(-90);
    const MAX_LAT = this.degToRad(90);
    const MIN_LON = this.degToRad(-180);
    const MAX_LON = this.degToRad(180);
    // Earth's radius (km)
    // R = 6378.1;
    // in feet
    const R = 20925524.93;
    // angular distance in radians on a great circle
    const radLDist = length / R;
    const radWDist = width / R;
    // center point coordinates (deg)
    const degLat = centerPoint[1];
    const degLon = centerPoint[0];
    // center point coordinates (rad)
    const radLat = this.degToRad(degLat);
    const radLon = this.degToRad(degLon);
    // minimum and maximum latitudes for given distance
    let minLat = radLat - radLDist;
    let maxLat = radLat + radLDist;
    // minimum and maximum longitudes for given distance
    let minLon = void 0;
    let maxLon = void 0;
    // define deltaLon to help determine min and max longitudes
    const deltaLon = Math.asin(Math.sin(radWDist) / Math.cos(radLat));
    if (minLat > MIN_LAT && maxLat < MAX_LAT) {
      minLon = radLon - deltaLon;
      maxLon = radLon + deltaLon;
      if (minLon < MIN_LON) {
        minLon = minLon + 2 * Math.PI;
      }
      if (maxLon > MAX_LON) {
        maxLon = maxLon - 2 * Math.PI;
      }
    } else {
      minLat = Math.max(minLat, MIN_LAT);
      maxLat = Math.min(maxLat, MAX_LAT);
      minLon = MIN_LON;
      maxLon = MAX_LON;
    }
    return [
      this.radToDeg(minLon),
      this.radToDeg(minLat),
      this.radToDeg(maxLon),
      this.radToDeg(maxLat),
    ];
  }

  async getDistantRelatedRecords(objIds, reltype) {
    // TODO: Change out the hardcoded [1]
    // console.log('mapService: ',this.mapService);
    // console.log('reltype: ', reltype);
    // console.log(objIds);
    if (reltype === 'deceased') {

      // get burial records
      const burtable = this.mapService.burialTable;
      const burialRel = this.mapService.gravesiteLayer.relationships.filter(x => x.name === this.config.get('toBurialRelationship'))[0];
      const relatedRecords = await <any > this.arcgisService.getRelatedTableData(
        this.mapService.gravesiteLayer.url + '/' + this.mapService.gravesiteLayer.layerId,
        objIds, burialRel.id, 'BurialRecords');
      // console.log('burial records: ', relatedRecords.results.relatedRecordGroups);
      const relatedBurials = [];
      if (relatedRecords.results.relatedRecordGroups.length > 0) {
        relatedRecords.results.relatedRecordGroups[0].relatedRecords.forEach(record => {
          relatedBurials.push(record.attributes);
        });
      }
      // console.log('relatedBurials: ', relatedBurials);
      const deceasedRelationship = burtable.relationships.filter(x => x.name === this.config.get('toDeceasedRelationship'))[0];
      // get the deceased records
      relatedBurials.forEach(async (record) => {
        const relatedDeceased = [];
        const deceasedRecords = await <any > this.arcgisService.basicGetRelatedTableData(burtable.url,
          record.OBJECTID, deceasedRelationship.id);
        // console.log('related deceased: ', deceasedRecords);
        if (deceasedRecords.length > 0) {
          deceasedRecords[0].relatedRecords.forEach(decRecord => {
            // decRecord.attributes.decObjId = record.OBJECTID;
            relatedDeceased.push({
              surname: decRecord.attributes.surname,
              name: decRecord.attributes.name,
            });
          });
        }
        record.relDeceased = relatedDeceased;
        // console.log('relatedDeceased: ', relatedDeceased);
      });
      return relatedBurials;
    } else if (reltype === 'owner') {

      // get sales records
      const saletable = this.mapService.salesTable;
      const saleRel = this.mapService.gravesiteLayer.relationships.filter(x => x.name === this.config.get('toSalesRelationship'))[0];
      const relatedRecords = await <any> this.arcgisService.getRelatedTableData(
        this.mapService.gravesiteLayer.url + '/' + this.mapService.gravesiteLayer.layerId,
        objIds, saleRel.id, 'SalesRecords');
      const relatedSales = [];
      // console.log('related sales: ', relatedRecords.results.relatedRecordGroups);
      if (relatedRecords.results.relatedRecordGroups.length > 0) {
        relatedRecords.results.relatedRecordGroups[0].relatedRecords.forEach(record => {
          relatedSales.push(record.attributes);
        });
      }
      // console.log('related sales: ', relatedSales);

      // get owner records
      const ownerRelationship = saletable.relationships.filter(x => x.name === this.config.get('toOwnerRelationship'))[0];
      relatedSales.forEach(async (record) => {
        const relatedOwners = [];
        // console.log(record);
        const ownerRecords = await <any > this.arcgisService.basicGetRelatedTableData(saletable.url,
          record.OBJECTID, ownerRelationship.id);
        // console.log('related owners: ', ownerRecords);
        if (ownerRecords.length > 0) {
          ownerRecords[0].relatedRecords.forEach(ownRecord => {
            relatedOwners.push({
              surname: ownRecord.attributes.surname,
              name: ownRecord.attributes.name,
            });
          });
        }
        record.relOwners = relatedOwners;
        // console.log('related owners: ',relatedOwners);
      });
      // console.log(relatedSales);
      return relatedSales;
    }
  }

  // Degress to radians helper
  degToRad(deg) {
    return deg * (Math.PI / 180);
  }

  radToDeg(rad) {
    return (180 * rad) / Math.PI;
  }

  // select a burial record and show the burial editing panel
  selectBurial(burial) {
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'Burials',
      data: {
        BurialRecords: burial,
      },
    });
  }

  addNewSale() {
    this.navigate.emit({
      type: 'Sales',
      data: {
        SalesRecords: {},
        relatedGlobalID: this.currentGrave.Location,
        from: 'Gravesites',
      },
    });
  }

  // add a new associated burial record - Representative
  addNewBurial() {
    this.navigate.emit({
      type: 'Burials',
      data: {
        BurialRecords: {},
        relatedGlobalID: this.currentGrave.GlobalID,
        from: 'Gravesites',
      },
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
      this.getGraveSiteData();
    });
  }

  deleteSale(dialog: TemplateRef<any>, sale) {
    this.selDeleteSale = sale;
    this.dialogService.open(
      dialog, {
        context: 'Are you sure you want to delete this record?',
        closeOnBackdropClick: false,
      });
  }

  confirmBurialDelete(dialog) {
    // console.log('actually delete now!', this.selDeleteburial);
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
      this.getGraveSiteData();
    });
  }

  // clicking on a specific record in the sales table to edit
  selectSale(sale) {
    // passing the tab name to the type property will navigate the tab specified
    this.navigate.emit({
      type: 'Sales',
      data: {
        SalesRecords: sale,
      },
    });
  }

  doneSaving(evt) {
    // update the client-side data with the updated saved record
    // this.toggleReadOnly(false);
    this.arcgisService.setData('Gravesites', evt);
    // this.getGraveSiteData();
  }

  toggleReadOnly(checked: boolean) {
    this.isChecked = checked;
    this.featureDataService.callReadOnlyToggle(checked);
  }

  cancel() {
    this.clearResults();
    console.log('cancel');
  }

  // helper
  isEmptyObject(obj) {
    return (obj && (Object.keys(obj).length === 0));
  }

  ngOnDestroy() {
    this.newFormReadySub.unsubscribe();
  }

}
