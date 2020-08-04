import { ConfigService } from './config.service';
import { Injectable } from '@angular/core';
import { loadModules } from 'esri-loader';
import { MapService } from '../../pages/dashboard/map/map.service';
import { RelatedRecords } from '../classes/related-records';

@Injectable({
  providedIn: 'root',
})
export class ArcgisService {

  constructor(private mapService: MapService, private config: ConfigService) { }

  // object to hold data between editing components
  public data: RelatedRecords = new RelatedRecords();

  async getRelatedTableDataFromFeatureService(featureLayer, relationshipId, objectIds) {
    return new Promise((resolve, reject): any => {
      // loadModules(['esri/tasks/support/RelationshipQuery']).then(([RelationshipQuery]) => {
        // relationship query parameter
        const query = {
          outFields: ['*'],
          relationshipId: relationshipId,
          objectIds: objectIds,
        };

        // query related features for given objectIds
        let allRelatedRecords = [];
        featureLayer.queryRelatedFeatures(query).then(function (result) {
          objectIds.forEach(function (objectId) {
            // print out the attributes of related features if the result
            // is returned for the specified objectId
            if (result[objectId]) {
              allRelatedRecords = allRelatedRecords.concat(result[objectId].features);
              // console.group('relationship for feature:', objectId)
              // result[objectId].features.forEach(function (feature) {
              //   console.log('attributes', JSON.stringify(feature.attributes));

              // });
              // console.groupEnd();
            }
          });
          resolve(allRelatedRecords);
        }).catch(function (error) {
          console.log('error from queryRelatedFeatures', error);
          reject(error);
        });
      // });
    });
  }

  // Function to search for generic layer data based on the following parameters
  async userParameterSearch(keyValue: any, searchType: string, dateMin ?: Date, dateMax ?: Date) {
    let searchURL = '';
    let nameSearchString = '';
    // let fieldName = '';
    let extraQuery = '';
    let whereClause = '';
    let orderField = '';
    // Might not need this.
    // It is just error checking for
    // keyValue being an object...
    if (typeof(keyValue === Object)) {
      if (keyValue.LName !== '' && keyValue.FName !== '') {
        nameSearchString = 'surname LIKE \'' + keyValue.LName + '%\' AND name LIKE \'' + keyValue.FName + '%\'';
        console.warn(nameSearchString);
        orderField = 'name';
      } else if (keyValue.LName !== '' && keyValue.FName === '') {
        nameSearchString = 'surname LIKE \'' + keyValue.LName  + '%\'';
        console.warn(nameSearchString);
        orderField = 'name';
      } else if (keyValue.LName === '' && keyValue.FName !== '') {
        nameSearchString = 'name LIKE \'' + keyValue.FName  + '%\'';
        console.warn(nameSearchString);
        orderField = 'surname';
      }
    }
    // Switch to specify search type
    switch (searchType) {
      // case 'people':
      //   searchURL = this.mapService.contactTable.url;
      //   fieldName = 'Name';
      //   break;
      case 'owner':
        searchURL = this.mapService.peopleTables.owner.url;
        whereClause = nameSearchString;
        // fieldName = 'surname';
        break;
      case 'representative':
        searchURL = this.mapService.peopleTables.representative.url;
        whereClause = nameSearchString;
        // fieldName = 'surname';
        break;
      case 'deceased':
        searchURL = this.mapService.peopleTables.deceased.url;
        whereClause = nameSearchString;
        // fieldName = 'surname';
        break;
      case 'ownerPID':
        searchURL = this.mapService.peopleTables.owner.url;
        whereClause = 'pidno = \'' + keyValue + '\'';
        orderField = 'pidno';
        break;
      case 'representativePID':
        searchURL = this.mapService.peopleTables.representative.url;
        whereClause = 'pidno = \'' + keyValue + '\'';
        orderField = 'pidno';
        break;
      case 'deceasedPID':
        searchURL = this.mapService.peopleTables.deceased.url;
        whereClause = 'pidno = \'' + keyValue + '\'';
        orderField = 'pidno';
        break;
      case 'sale':
        searchURL = this.mapService.salesTable.url;
        // fieldName = 'grantno';
        if (keyValue !== '') {
          whereClause = 'grantno LIKE \'%' + keyValue + '%\'';
          if (dateMin != null || dateMax != null) {
            // Format the date and time
            const formattedDateMin = dateMin.toLocaleDateString();
            const formattedDateMax = dateMax.toLocaleDateString();
            extraQuery = 'saledate >=\'' + formattedDateMin + '\' AND saledate <= \'' + formattedDateMax + '\'';
            // console.log('Extra Query: ', extraQuery);
          } else {
            extraQuery = '';
          }
        } else {
          if (dateMin != null || dateMax != null) {
            // Format the date and time
            const formattedDateMin = dateMin.toLocaleDateString();
            const formattedDateMax = dateMax.toLocaleDateString();
            whereClause = 'saledate >=\'' + formattedDateMin + '\' AND saledate <= \'' + formattedDateMax + '\'';
            extraQuery = '';
            // console.log('Extra Query: ', whereClause);
          }
        }
        orderField = 'grantno';
        break;
      case 'burial':
        searchURL = this.mapService.burialTable.url;
        if (keyValue !== '') {
          whereClause = this.config.get('burialSearchResults') + ' LIKE \'%' + keyValue + '%\'';
          if (dateMin != null || dateMax != null) {
            // Format the date and time
            // const formattedDateMin = ((dateMin.getMonth() + 1) + '/' + dateMin.getDay() + '/' + dateMin.getFullYear()).toString();
            // const formattedDateMax = ((dateMax.getMonth() + 1) + '/' + dateMax.getDay() + '/' + dateMax.getFullYear()).toString();
            const formattedDateMin = dateMin.toLocaleDateString();
            const formattedDateMax = dateMax.toLocaleDateString();
            extraQuery = ' AND fundate >=\'' + formattedDateMin + '\' AND fundate <= \'' + formattedDateMax + '\'';
            // console.log('Extra Query: ', extraQuery);
          } else {
            extraQuery = '';
          }
        } else {
          if (dateMin != null || dateMax != null) {
            // Format the date and time
            const formattedDateMin = dateMin.toLocaleDateString();
            const formattedDateMax = dateMax.toLocaleDateString();
            whereClause = 'fundate >=\'' + formattedDateMin + '\' AND fundate <= \'' + formattedDateMax + '\'';
            extraQuery = '';
            // console.log('Extra Query: ', extraQuery);
          }
        }
        orderField = this.config.get('burialSearchResultsSort');
        break;
      case 'gravesite':
        break;
    }
    // Pass switch parameters into function
    // console.log('QUERY: ', whereClause + extraQuery);
    return new Promise((resolve, reject): any => {
      loadModules(['esri/request']).then(([esriRequest]) => {

        esriRequest(searchURL + '/query', {
          responseType: 'json',
          method: 'post',
          query: {
            f: 'json',
            // where: fieldName + ' LIKE \'%' + keyValue + '%\'' + extraQuery,
            where: whereClause + extraQuery,
            outFields: '*',
            orderByFields: orderField,
            returnGeometry: false,
          },
        }).then((result) => {
          resolve(result.data);
        }).catch((err) => {
          reject(err);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  async getRelatedTableData(url, objectIds, relationshipId, name) {
    // console.log('parameters for get related: ', url, '\n', objectIds, '\n', relationshipId, '\n', name);
    // console.log('typeof objectids: ', typeof objectIds);
    let objectIdQuery;
    if (typeof objectIds === 'object') {
      objectIdQuery = objectIds.join(',');
    } else {
      objectIdQuery = objectIds;
    }
    const self = this;
    // self.data = new RelatedRecords();
    return new Promise((resolve, reject): any => {
      loadModules(['esri/request']).then(([esriRequest]) => {
        esriRequest(url +  '/queryRelatedRecords', {
          responseType: 'json',
          method: 'post',
          query: {
            f: 'json',
            objectIds: objectIdQuery,
            relationshipId: relationshipId,
            outFields: '*',
            returnGeometry: false,
          },
        }).then((result) => {
          try {
            // console.log(result);
            if (result.data.relatedRecordGroups.length > 0 && result.data.relatedRecordGroups[0].relatedRecords.length > 0) {
              self.data[name] =
                result.data.relatedRecordGroups[0].relatedRecords.map(a => (a.attributes));
                // console.log(self.data);
            } else {
              self.data[name] = [];
            }
            resolve({
              name: name,
              results: result.data,
            });
          } catch (err) {
            console.log('error', err);
            reject(err);
          }
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

async getMaxValue(url, fieldName) {
    return new Promise<number>((resolve, reject): any => {
      loadModules(['esri/request']).then(([esriRequest]) => {
        const statDef = '[{"onStatisticField": "' + fieldName + '", "outStatisticFieldName": "maxValue", "statisticType": "max"}]';
        esriRequest(url + '/query', {
          responseType: 'json',
          query: {
            f: 'json',
            outStatistics: statDef,
          },
        }).then((result) => {
          try {
            resolve(result.data.features[0].attributes.maxValue);
          } catch (err) {
            console.log('error', err);
          }
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  // get related records without setting any data objects in the service
  async basicGetRelatedTableData(url, objectIds, relationshipId) {
    // console.log('parameters for get related: ', url, '\n', objectIds, '\n', relationshipId, '\n', name);
    // console.log('typeof objectids: ', typeof objectIds);
    let objectIdQuery;
    if (typeof objectIds === 'object') {
      objectIdQuery = objectIds.join(',');
    } else {
      objectIdQuery = objectIds;
    }
    const self = this;
    return new Promise((resolve, reject): any => {
      loadModules(['esri/request']).then(([esriRequest]) => {
        esriRequest(url +  '/queryRelatedRecords', {
          responseType: 'json',
          method: 'post',
          query: {
            f: 'json',
            objectIds: objectIdQuery,
            relationshipId: relationshipId,
            outFields: '*',
            returnGeometry: false,
          },
        }).then((result) => {
          // console.log(result.data.results.relatedRecordGroups[0].relatedRecords.map(a => (a.attributes)));
          // try {
            // if (result.data.relatedRecordGroups.length > 0 && result.data.relatedRecordGroups[0].relatedRecords.length > 0) {
            //   self.data[name] =
            //     result.data.relatedRecordGroups[0].relatedRecords.map(a => (a.attributes));
            // } else {
            //   self.data[name] = [];
            // }
          resolve(result.data.relatedRecordGroups);
          // } catch (err) {
          //   console.log('error', err);
          //   reject(err);
          // }
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  // delete a record from a stand alone table
  delete (url, objectId) {
    return new Promise((resolve, reject) => {
      loadModules(['esri/request'])
        .then(([esriRequest]) => {
          esriRequest(url + '/deleteFeatures', {
            responseType: 'json',
            method: 'post',
            query: {
              f: 'json',
              objectIds: objectId,
            },
          }).then((result) => {
            resolve(result.data);
          }).catch(function(err) {
            console.error('Delete FAILED: ', err);
          });
        });
    });
  }

  setData(type, newData) {
    if (newData.type === 'update') {
      this.data[type].forEach((record, index) => {
        if (record.OBJECTID === newData.data.OBJECTID) {
          this.data[type].splice(index, 1);
          this.data[type].push(newData.data);
        }
      });
    } else if (newData.type === 'add') {
      this.data[type].push(newData.data);
    } else if (newData.type === 'delete') {
      this.data[type].forEach((record, index) => {
        if (record.OBJECTID === newData.data.OBJECTID) {
          this.data[type].splice(index, 1);
          // this.data[type].push(newData.data);
        }
      });
    }
    // console.log(this.data[type]);
  }

  // clear the stored data object
  clearData() {
    for (const key in this.data) {
      if (this.data.hasOwnProperty(key)) {
        this.data[key] = [];
      }
    }
  }

  // date formatting function
  public formatDate(date) {
    return (date.getMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getFullYear();
  }
}
