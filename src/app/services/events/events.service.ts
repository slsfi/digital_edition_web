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
    // title-logo-show
    private titleLogoShow = new Subject<any>();
    // title-logo:setTitle
    private titleLogoSetTitle = new Subject<any>();
    // title-logo:setSubTitle
    private titleLogoSetSubTitle = new Subject<any>();
    // topMenu:help
    private topMenuHelp = new Subject<any>();
    // topMenu:elasticSearch
    private topMenuElasticSearch = new Subject<any>();
    // topMenu:front
    private topMenuFront = new Subject<any>();
    // topMenu:content
    private topMenuContent = new Subject<any>();
    // topMenu:about
    private topMenuAbout = new Subject<any>();
    // topMenu:music
    private topMenuMusic = new Subject<any>();
    // title-logo:collectionTitle
    private titleLogoCollectionTitle = new Subject<any>();


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

    publishTitleLogoShow(data?: any) {
        this.titleLogoShow.next(data);
    }

    getTitleLogoShow(): Subject<any> {
        return this.titleLogoShow;
    }

    publishTitleLogoSetTitle(data?: any) {
        this.titleLogoSetTitle.next(data);
    }

    getTitleLogoSetTitle(): Subject<any> {
        return this.titleLogoSetTitle;
    }

    publishTitleLogoSetSubTitle(data?: any) {
        this.titleLogoSetSubTitle.next(data);
    }

    getTitleLogoSetSubTitle(): Subject<any> {
        return this.titleLogoSetSubTitle;
    }

    publishTopMenuHelp(data?: any) {
        this.topMenuHelp.next(data);
    }

    getTopMenuHelp(): Subject<any> {
        return this.topMenuHelp;
    }

    publishTopMenuElasticSearch(data?: any) {
        this.topMenuElasticSearch.next(data);
    }

    getTopMenuElasticSearch(): Subject<any> {
        return this.topMenuElasticSearch;
    }

    publishTopMenuFront(data?: any) {
        this.topMenuFront.next(data);
    }

    getTopMenuFront(): Subject<any> {
        return this.topMenuFront;
    }

    publishTopMenuContent(data?: any) {
        this.topMenuContent.next(data);
    }

    getTopMenuContent(): Subject<any> {
        return this.topMenuContent;
    }

    publishTopMenuAbout(data?: any) {
        this.topMenuAbout.next(data);
    }

    getTopMenuAbout(): Subject<any> {
        return this.topMenuAbout;
    }

    publishTopMenuMusic(data?: any) {
        this.topMenuMusic.next(data);
    }

    getTopMenuMusic(): Subject<any> {
        return this.topMenuMusic;
    }

    publishTitleLogoCollectionTitle(data?: any) {
        this.titleLogoCollectionTitle.next(data);
    }

    getTitleLogoCollectionTitle(): Subject<any> {
        return this.titleLogoCollectionTitle;
    }
}