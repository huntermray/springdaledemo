import { ConfigService } from './../../../services/config.service';
import { NbDialogService } from '@nebular/theme';
import { Component, OnInit, TemplateRef, ViewChild, EventEmitter } from '@angular/core';

@Component({
  selector: 'ngx-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.scss'],
})
export class HomePanelComponent implements OnInit {

  @ViewChild('dialog', {static: true}) public dialog: TemplateRef<any>;
  evt: any;

  constructor(private dialogService: NbDialogService, private config: ConfigService) { }

  ModalTitle: string = this.config.get('WelcomeModalTitle');
  ModalDialog: string = this.config.get('WelcomeModalContent');

  ngOnInit() {
    const showAgain = JSON.parse(localStorage.getItem('#DoNotShowAgain'));
    // console.log('show again state: ', showAgain);
    if (showAgain === false || showAgain == null) {
      this.open(this.dialog);
    }
  }

  open(dialog: TemplateRef<any>) {
    this.dialogService.open(dialog, { context: this.ModalDialog });
  }

  saveCheckboxState(evt) {
    console.log('You checked the box');
    this.evt = evt;
    console.warn('box state: ', this.evt);
    localStorage.setItem('#DoNotShowAgain', this.evt);
  }
}
