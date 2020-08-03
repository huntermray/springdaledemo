import { ConfigService } from './../../../@core/services/config.service';
import { Injectable } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri;
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapService {

  public mapView: esri.MapView;
  public webmap: esri.WebMap;
  public featureLayerViews: Array<esri.FeatureLayerView> = [];
  public nonEditableFeatureLayerViews: Array<esri.FeatureLayerView> = [];
  public highlightedFeatures: esri.GraphicsLayer;
  public contactTable: any;
  // public ownerTable: any;
  // public deceasedTable: any;
  // public representativeTable: any;
  public peopleTables = {
    owner: null,
    representative: null,
    deceased: null,
  };
  public salesTable: any;
  public burialTable: any;
  public gravesiteLayer: esri.FeatureLayer;
  public burialAreasLayer: esri.FeatureLayer;
  public sectionsLayer: esri.FeatureLayer;
  public burialAreasSearchField: string;
  public sectionsSearchField: string;

  private mapClickResults = new Subject<any>();
  mapClickResults$ = this.mapClickResults.asObservable();
  private mapClickHandler: any;

  // trigger the map loaded event so users can continue to search for people
  private mapLoaded = new Subject<any>();
  mapLoaded$ = this.mapLoaded.asObservable();

  constructor(private config: ConfigService) { }

  loadMap(mapViewEl, webMapId) {
    const self = this;
    // load the needed Map and MapView modules from the JSAPI
    loadModules([
      'esri/Map',
      'esri/views/MapView',
      'esri/core/watchUtils',
      'esri/geometry/Extent',
      'esri/geometry/SpatialReference',
      'esri/widgets/Home',
      'esri/WebMap',
      'esri/layers/GraphicsLayer',
      'esri/widgets/Print',
      'esri/widgets/Expand',
    ]).then(([
      Map,
      MapView,
      watchUtils,
      Extent,
      SpatialReference,
      Home,
      WebMap,
      GraphicsLayer,
      Print,
      Expand,
    ]) => {
      // load the web map from the config file
      this.webmap = new WebMap({
        portalItem: {
          id: webMapId,
        },
      });
      // console.log(webmap);

      this.mapView = new MapView({
        map: this.webmap,  // The WebMap instance created above
        container: mapViewEl.nativeElement,
      });

      watchUtils.whenTrueOnce(this.webmap, 'loaded', async () => {
        // add all fields to the outFields queries
        this.webmap.layers.forEach(layer => {
          if (layer.type === 'feature') {
            const featureLayer = <esri.FeatureLayer>layer;
            if (featureLayer.title === this.config.get('graveSitesLayerName')) {
              this.gravesiteLayer = featureLayer;
            }
            if (featureLayer.title === this.config.get('SearchOptions').Layers[0].Title) {
              this.sectionsLayer = featureLayer;
                this.sectionsSearchField = this.config.get('SearchOptions').Layers[0].Field;
            }
            if (featureLayer.title === this.config.get('SearchOptions').Layers[1].Title) {
              this.burialAreasLayer = featureLayer;
                this.burialAreasSearchField = this.config.get('SearchOptions').Layers[1].Field;
            }
            featureLayer.outFields = ['*'];
          }
        });
        this.setupSearchWidget();

        // add the hightlighted graphics layer
        self.highlightedFeatures = new GraphicsLayer();
        this.webmap.add(self.highlightedFeatures);

        // set the contact table
        this.contactTable = this.webmap.tables.filter(x => x.title === this.config.get('contactTableName'))[0];
        const contactDetails = await <any>this.getFullTableDetails(this.contactTable);
        this.contactTable.relationships = contactDetails.relationships;
        this.contactTable.fields = contactDetails.fields;
        // console.log('contact', this.contactTable);

        // set the owner table
        // this.ownerTable = webmap.tables.filter(x => x.title === this.config.get('ownerTableName'))[0];
        // const ownerDetails = await <any>this.getFullTableDetails(this.ownerTable);
        // this.ownerTable.relationships = ownerDetails.relationships;
        // this.ownerTable.fields = ownerDetails.fields;
        this.peopleTables.owner = this.webmap.tables.filter(x => x.title === this.config.get('ownerTableName'))[0];
        const ownerDetails = await <any>this.getFullTableDetails(this.peopleTables.owner);
        this.peopleTables.owner.relationships = ownerDetails.relationships;
        this.peopleTables.owner.fields = ownerDetails.fields;
        // console.log('owner', this.ownerTable);

        // set the deceased table
        // this.deceasedTable = webmap.tables.filter(x => x.title === this.config.get('deceasedTableName'))[0];
        // const deceasedDetails = await <any>this.getFullTableDetails(this.deceasedTable);
        // this.deceasedTable.relationships = deceasedDetails.relationships;
        // this.deceasedTable.fields = deceasedDetails.fields;
        this.peopleTables.deceased = this.webmap.tables.filter(x => x.title === this.config.get('deceasedTableName'))[0];
        const deceasedDetails = await <any>this.getFullTableDetails(this.peopleTables.deceased);
        this.peopleTables.deceased.relationships = deceasedDetails.relationships;
        this.peopleTables.deceased.fields = deceasedDetails.fields;
        // console.log('deceased', this.deceasedTable);

        // set the representative table
        // this.representativeTable = webmap.tables.filter(x => x.title === this.config.get('representativeTableName'))[0];
        // const representativeDetails = await <any>this.getFullTableDetails(this.representativeTable);
        // this.representativeTable.relationships = representativeDetails.relationships;
        // this.representativeTable.fields = representativeDetails.fields;
        this.peopleTables.representative = this.webmap.tables.filter(x => x.title === this.config.get('representativeTableName'))[0];
        const representativeDetails = await <any>this.getFullTableDetails(this.peopleTables.representative);
        this.peopleTables.representative.relationships = representativeDetails.relationships;
        this.peopleTables.representative.fields = representativeDetails.fields;
        // console.log('representative', this.representativeTable);

        // set the sales table
        this.salesTable = this.webmap.tables.filter(x => x.title === this.config.get('salesTableName'))[0];
        const saleDetails = await <any>this.getFullTableDetails(this.salesTable);
        this.salesTable.relationships = saleDetails.relationships;
        this.salesTable.fields = saleDetails.fields;
        // console.log('sales', this.salesTable);

        // set the burial table
        this.burialTable = this.webmap.tables.filter(x => x.title === this.config.get('burialTableName'))[0];
        const burialDetails = await <any>this.getFullTableDetails(this.burialTable);
        this.burialTable.relationships = burialDetails.relationships;
        this.burialTable.fields = burialDetails.fields;
        // console.log('burials', this.burialTable);
        this.mapLoaded.next();
      });

      // setup the map click handler that push the data over to the side panel
      this.mapView.when((response) => {
        // console.log('view ready: ', self.mapView.ready);
        // setup the loading indicator
        // watchUtils.whenTrue(self.mapView, 'updating', () => {
        //   self.mapLoading.next(true);
        //   // console.log('map view updating: ', this.mapView.updating);
        // });
        // watchUtils.whenFalse(self.mapView, 'updating', () => {
        //   self.mapLoading.next(false);
        //   // console.log('map view updating: ', this.mapView.updating);
        // });

        // add the print widget to the map UI
        const print = new Print({
          view: this.mapView,
          container: document.createElement('div'),
          // specify your own print service
          printServiceUrl:
            this.config.get('printService'),
        });

        // Add widget to the top right corner of the view
        const printExpand = new Expand({
          expandIconClass: 'esri-icon-printer',
          view: this.mapView,
          content: print.domNode,
        });
        this.mapView.ui.add(printExpand, 'top-left');

        const allLayerPromises = [];
        const layerList = [];
        const searchLayerList = [];
        // after the new is ready cycling through each webmap layer and wait for the view to load
        this.webmap.layers.forEach(webmapLayer => {
          if (webmapLayer.type === 'feature') {
            // searchLayerList.push(new LayerSearchSource({
            //   featureLayer: webmapLayer
            // }));
            layerList.push(webmapLayer);
            allLayerPromises.push(self.mapView.whenLayerView(webmapLayer));
          } else if (webmapLayer.type === 'map-image' || webmapLayer.type === 'tile') {
            // console.log(webmapLayer);
            // add image and tile layers to the identify array
            // self.mapImageLayers.push(<esri.MapImageLayer>webmapLayer);
            // layerList.push(webmapLayer);
          }
        });

        // resolve all layer views
        Promise.all(allLayerPromises.map(p => p.catch(error => {
          console.error(error);
          return error;
        }))).then((results) => {
          const validResults = results.filter(result => !(result.details ? result.details.hasOwnProperty('error') : false));
          // define the editable versus non-editable layers depending on which app the user is on
          validResults.forEach(layerView => {
            if (layerView.layer.capabilities.operations.supportsEditing === true &&
              layerView.layer.title === this.config.get('graveSitesLayerName')) {
              // console.log('editable view: ', layerView.layer);
              self.featureLayerViews.push(layerView);
            } else {
              self.nonEditableFeatureLayerViews.push(layerView);
            }
          });
        });
      });

      this.setupDefaultClickHandler();
      // move the zoom in/zoom out button to top left
      this.mapView.ui.move(['zoom'], 'top-left');

      // add the home widget to the map
      const homeWidget = new Home({
        view: this.mapView,
      });

      // adds the home widget to the top left corner of the MapView
      this.mapView.ui.add(homeWidget, 'top-left');
    });
  }

  setupDefaultClickHandler() {
    const self = this;
    loadModules(['esri/tasks/support/Query']).then(([Query]) => {
      this.mapClickHandler = this.mapView.on('click', function(event) {
        self.mapView.popup.close();
        // loop through the layerviews and select all of the graphics
        const viewQueryPromises = [];
        const nonEditableQueryPromises = [];
        const query = new Query();
        self.getQueryExtent(event.mapPoint).then(queryExtent => {
          query.geometry = queryExtent;
          query.returnGeometry = true;
          query.outFields = ['*'];
          query.spatialRelationship = 'intersects';
          // console.log(self.featureLayerViews);
          // query the editable feature layers
          self.featureLayerViews.forEach(layerView => {
            // only query the visible layers
            if (layerView.visible === true) {
              viewQueryPromises.push(layerView.queryFeatures(query));
            }
          });

          // query all of the non editable layers
          // console.log('non-editable layers: ', self.nonEditableFeatureLayerViews);
          self.nonEditableFeatureLayerViews.forEach(nonEditableLayerView => {
            if (nonEditableLayerView.visible === true) {
              nonEditableQueryPromises.push(nonEditableLayerView.queryFeatures(query));
            }
          });

          // get all graphics once queries complete
          Promise.all(viewQueryPromises).then(results => {
            let allGraphics = [];
            results.forEach(layerResult => {
              allGraphics = allGraphics.concat(layerResult.features);
            });
            // console.log('all features: ', allGraphics);
            if (allGraphics.length === 0) {
            }
            // console.log('allGraphics: ', allGraphics);
            // highlight the features on the map
            self.highlightFeature(allGraphics);
            self.mapClickResults.next(allGraphics);
          }); // of of all promise resolution

          // resolve all of the non-editable layer queries
          Promise.all(nonEditableQueryPromises).then(nonResults => {
            // console.log('number of non editable results: ', nonResults);
            if (nonResults.length > 0) {
              let allFeatures = [];
              nonResults.forEach(result => {
                allFeatures = allFeatures.concat(result.features);
              });
              if (allFeatures.length > 0) {
                allFeatures.forEach(feature => {
                  if (feature.layer != null) {
                    feature.popupTemplate = feature.layer.popupTemplate;
                  } else {
                    feature.popupTemplate = feature.sourceLayer.popupTemplate;
                  }
                });
                // set the popup template to the feature layers popuptemplate
                self.mapView.popup.features = allFeatures;
                // console.log(self.mapView.popup.features);
                self.mapView.popup.location = event.mapPoint;
                // Displays the popup
                self.mapView.popup.visible = true;
              }
            }
          });
        }); // end of getting query extent
      });
    });
  }

  // helper for removing click handler when gravesite creation click handler is active
  removeClickHandler() {
    if (this.mapClickHandler != null) {
      this.mapClickHandler.remove();
      this.mapClickHandler = null;
    }
  }

  private async getFullTableDetails(table) {
    return new Promise((resolve, reject): any => {
      loadModules(['esri/request']).then(([esriRequest]) => {
        esriRequest(table.url + '/', {
          responseType: 'json',
          method: 'post',
          query: {
            f: 'json',
          },
        }).then((result) => {
          resolve(result.data);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  // query the gravesites feature layer to get the full geometry for highlighting on the map
  async getFullGeometry(objectids) {
    const self = this;
    return new Promise((resolve, reject) => {
      loadModules([
        'esri/tasks/support/Query',
      ]).then(([
        Query,
      ]) => {
        const featureQuery = new Query({
          objectIds: objectids,
          outFields: ['*'],
          returnGeometry: true,
          outSpatialReference: {
            wkid: 102100,
          },
        });
        self.gravesiteLayer.queryFeatures(featureQuery).then(fullResult => {
          // console.log('full feature: ', fullResult);
          self.highlightFeature(fullResult.features);
          self.mapView.goTo(fullResult.features);
        });
        // resolve(newExtent);
      });
    });
  }

  setupSearchWidget() {
    loadModules(['esri/widgets/Search']).then(([Search]) => {
      const placeholderText = this.config.get('SearchOptions').PlaceholderText;
      const burialAreasFieldArr = [];
      const subsectionFieldArr = [];
      // TODO: Make the search fields read from the config
      const searchWidget = new Search({
        view: this.mapView,
        allPlaceholder: placeholderText,
        includeDefaultSources: false,
        locationEnabled: false,
        popupEnabled: false,
        sources: [
          {
            layer: this.burialAreasLayer,
            searchFields: ['Name'],
            displayField: "Name",
            outFields: ['*'],
            exactMatch: false,
            name: "Burial Areas",
          },
          {
            layer: this.sectionsLayer,
            searchFields: ['Subsection'],
            displayField: "Subsection",
            outFields: ['*'],
            exactMatch: false,
            name: "Subsection",
          },
          {
            layer: this.gravesiteLayer,
            searchFields: ['Location'],
            displayField: "Location",
            outFields: ['*'],
            exactMatch: false,
            name: "Gravesites",
          },
        ],
        maxSuggestions: 35,
      });
      this.mapView.ui.add(searchWidget, 'top-right');
    });
  }

  getQueryExtent(mapPoint) {
    const self = this;
    return new Promise((resolve, reject) => {
      loadModules([
        'esri/geometry/Extent',
      ]).then(([
        Extent,
      ]) => {
        const mapWidth = self.mapView.extent.width;

        // Divide width in map units by width in pixels
        const pixelWidth = mapWidth / self.mapView.width;

        // Calculate a 10 pixel envelope width (5 pixel tolerance on each side)
        const tolerance = 5 * pixelWidth;

        // Build tolerance envelope and set it as the query geometry
        const extentProps = {
          xmin: mapPoint.x - tolerance,
          ymin: mapPoint.y - tolerance,
          xmax: mapPoint.x + tolerance,
          ymax: mapPoint.y + tolerance,
          spatialReference: mapPoint.spatialReference,
        };
        const newExtent = new Extent(extentProps);
        resolve(newExtent);
      });
    });
  }

  highlightFeature(features) {
    loadModules([
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/symbols/SimpleLineSymbol',
    ]).then(([
      SimpleFillSymbol,
      SimpleMarkerSymbol,
      SimpleLineSymbol,
    ]) => {
      // clear the previous selection
       // this.mapView.graphics.removeAll();
      this.highlightedFeatures.removeAll();
      // setup the highlighting symbol - polygon
      const symbolProps = {
        style: 'none',
        outline: {
          width: 3,
          color: [255, 255, 0, 1],
        },
      };
      const polygonHighlightSymbol = new SimpleFillSymbol(symbolProps);

      // setup the highlighting symbol - point
      const ptSymbolProps = {
        outline: {
            color: [115, 255, 223, 1],
        },
        size: 8,
        color: [255, 255, 0, 1],
      };
      const pointHighlightSymbol = new SimpleMarkerSymbol(ptSymbolProps);

      // setup the highlighting symbol - polyline
      const lineSymbolProps = {
        type: 'simple-line',
        join: 'bevel',
        width: 3,
        color: [255, 255, 0, 1],
      };
      const lineHighlightSymbol = new SimpleLineSymbol(lineSymbolProps);

      // Create a graphic and add the geometry and symbol to it
      for (let p = 0; p < features.length; p++) {
        // console.log('Highlight: ', features[p]);
        switch (features[p].geometry.type) {
          case 'point':
            features[p].symbol = pointHighlightSymbol;
            break;
          case 'polyline':
            features[p].symbol = lineHighlightSymbol;
            break;
          case 'polygon':
            features[p].symbol = polygonHighlightSymbol;
            break;
        }
        // features[p].symbol = highlightSymbol;
        this.highlightedFeatures.add(features[p]);
        // this.mapView.graphics.add(features[p]);
      }
    });
  }
}
