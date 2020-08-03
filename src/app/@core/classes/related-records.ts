export class RelatedRecords {
  SalesRecords: Array<any> = [];
  BurialRecords: Array<any> = [];
  DeceasedTable: Array<any> = [];
  ContactTable: Array<any> = [];
  RepresentativeTable: Array<any> = [];
  OwnerTable: Array<any> = [];
  gravesites: Array<any> = [];

  // deprecated
  Gravesites: Array<any> = [];
  PeopleRecords: Array<any> = [];

  constructor() {
    this.SalesRecords = [];
    this.BurialRecords = [];
    this.DeceasedTable = [];
    this.ContactTable = [];
    this.RepresentativeTable = [];
    this.OwnerTable = [];
    this.gravesites = [];

    // deprecated
    this.Gravesites = [];
    this.PeopleRecords = [];
  }
}
