import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EventsService {

    // share:dismiss
    private shareDismiss = new Subject<any>();
    // download-texts-modal:dismiss
    private downloadTextsModalDismiss = new Subject<any>();
    // language-static:change
    private languageStaticChange = new Subject<any>();
    // ionViewWillLeave
    private ionViewWillLeave = new Subject<any>();
    // ionViewWillEnter
    private ionViewWillEnter = new Subject<any>();
    // searchModal:closed
    private searchModalClosed = new Subject<any>();
    // show:view
    private showView = new Subject<any>();
    // DigitalEditionList:recieveData
    private digitalEditionListRecieveData = new Subject<any>();
    // digital-edition-list:open
    private digitalEditionListOpen = new Subject<any>();
    // openMediaCollections
    private openMediaCollections = new Subject<any>();
    // open:pdf
    private openPdf = new Subject<any>();

    publishShareDismiss(data?: any) {
        this.shareDismiss.next(data);
    }

    getShareDismiss(): Subject<any> {
        return this.shareDismiss;
    }

    publishDownloadTextsModalDismiss(data?: any) {
        this.downloadTextsModalDismiss.next(data);
    }

    getDownloadTextsModalDismiss(): Subject<any> {
        return this.downloadTextsModalDismiss;
    }

    publishLanguageStaticChange(data?: any) {
        this.languageStaticChange.next(data);
    }

    getLanguageStaticChange(): Subject<any> {
        return this.languageStaticChange;
    }

    publishIonViewWillLeave(data?: any) {
        this.ionViewWillLeave.next(data);
    }

    getIonViewWillLeaves(): Subject<any> {
        return this.ionViewWillLeave;
    }

    publishIonViewWillEnter(data?: any) {
        this.ionViewWillEnter.next(data);
    }

    getIonViewWillEnter(): Subject<any> {
        return this.ionViewWillEnter;
    }

    publishSearchModalClosed(data?: any) {
        this.searchModalClosed.next(data);
    }

    getSearchModalClosed(): Subject<any> {
        return this.searchModalClosed;
    }

    publishShowView(data?: any) {
        this.showView.next(data);
    }

    getShowView(): Subject<any> {
        return this.showView;
    }

    publishDigitalEditionListRecieveData(data?: any) {
        this.digitalEditionListRecieveData.next(data);
    }

    getDigitalEditionListRecieveData(): Subject<any> {
        return this.digitalEditionListRecieveData;
    }

    publishDigitalEditionListOpen(data?: any) {
        this.digitalEditionListOpen.next(data);
    }

    getDigitalEditionListOpen(): Subject<any> {
        return this.digitalEditionListOpen;
    }

    publishOpenMediaCollections(data?: any) {
        this.openMediaCollections.next(data);
    }

    getOpenMediaCollections(): Subject<any> {
        return this.openMediaCollections;
    }

    publishOpenPdf(data?: any) {
        this.openPdf.next(data);
    }

    getOpenPdf(): Subject<any> {
        return this.openPdf;
    }
}