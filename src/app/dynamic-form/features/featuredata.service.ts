import { Injectable } from '@angular/core';
import { loadModules } from 'esri-loader';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeaturedataService {

  private featureData: any;

  constructor() { }

  private mapFeatureResults = new Subject<any>();
  mapFeatureResults$ = this.mapFeatureResults.asObservable();

  private readOnlyToggle = new Subject<any>();
  readOnlyToggle$ = this.readOnlyToggle.asObservable();

  callReadOnlyToggle(checked) {
    // console.log('this.readOnlyToggle.next...');
    this.readOnlyToggle.next(checked);
  }

  setFeatureContent(features) {
    this.featureData = features;
    this.mapFeatureResults.next(features);
  }

  getFeatureContent() {
    return this.featureData;
  }

  // save table data back to the ArcGIS feature service
  save(data, url) {
    return new Promise((resolve, reject) => {
      const theComponent = this;
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/updateFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              features: JSON.stringify([{
                'attributes': data,
              }]),
            },
          }).then((result) => {
            resolve(result.data);
          });
        });
    });
  }

  // add table data to the ArcGIS feature service
  add(data, url) {
    return new Promise((resolve, reject) => {
      const theComponent = this;
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/addFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              features: JSON.stringify([{
                'attributes': data,
              }]),
            },
          }).then((result) => {
            resolve(result.data);
          });
        });
    });
  }

  delete (objectId, url) {
    return new Promise((resolve, reject) => {
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/deleteFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              objectIds: [objectId],
            },
          }).then((result) => {
            resolve(result.data);
          }).catch(function(err) {
            console.error('Delete FAILED: ', err);
          });
        });
    });
  }

  // might consider moving these out of this component at some point
  async addPeopleRelationshipRecord(url, peopleId, salesId) {
    return new Promise((resolve, reject) => {
      const theComponent = this;
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/addFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              features: JSON.stringify([{
                'attributes': {
                  'OwnerID': peopleId,
                  'SaleID': salesId,
                },
              }]),
            },
          }).then((result) => {
            resolve(result.data);
          });
        });
    });
  }

  // might consider moving these out of this component at some point
  removePeopleRelationshipRecord(url, personId, saleId) {
    return new Promise((resolve, reject) => {
      const theComponent = this;
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/deleteFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              where: 'OwnerID = \'' + personId + '\' AND SaleID = \'' + saleId + '\'',
            },
          }).then((result) => {
            resolve(result.data);
          });
        });
    });
  }

  // might consider moving these out of this component at some point
  async addBurialRelationshipRecord(url, burialId, graveId) {
    return new Promise((resolve, reject) => {
      const theComponent = this;
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/addFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              features: JSON.stringify([{
                'attributes': {
                  'GraveID': graveId,
                  'BurialID': burialId,
                },
              }]),
            },
          }).then((result) => {
            resolve(result.data);
          }).catch((err) => {
            console.log(err);
          });
        });
    });
  }

  getAttachments(featureLayer, objectIds) {
    return featureLayer.queryAttachments({
      objectIds: objectIds,
    });
  }

  async checkIfUniqueValue(url, value) {
    return new Promise((resolve, reject): any => {
      loadModules(['esri/request']).then(([esriRequest]) => {
        esriRequest(url + '/query', {
          responseType: 'json',
          query: {
            f: 'json',
            where: 'pidno = \'' + value + '\'',
            outFields: 'pidno',
            returnGeometry: false,
            returnUniqueIdsOnly: true,
          },
        }).then((result) => {
          resolve(result.data);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

}
