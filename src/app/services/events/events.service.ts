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
    // tableOfContents:unSelectSelectedTocItem
    private tableOfContentsUnSelectSelectedTocItem = new Subject<any>();
    // SelectedItemInMenu
    private selectedItemInMenu = new Subject<any>();
    // musicAccordion:SetSelected
    private musicAccordionSetSelected = new Subject<any>();
    // aboutMarkdownTOC:loaded
    private aboutMarkdownTOCLoaded = new Subject<any>();
    // pdfview:open
    private pdfviewOpen = new Subject<any>();
    // CollectionWithChildrenPdfs:highlight
    private collectionWithChildrenPdfsHighlight = new Subject<any>();
    // exitActiveCollection
    private exitActiveCollection = new Subject<any>();
    // musicAccordion:reset
    private musicAccordionReset = new Subject<any>();
    // collectionsAccordion:change
    private collectionsAccordionChange = new Subject<any>();
    // typesAccordion:change
    private typesAccordionChange = new Subject<any>();
    // aboutAccordion:change
    private aboutAccordionChange = new Subject<any>();
    // tableOfContents:loaded
    private tableOfContentsLoaded = new Subject<any>();
    // exitedTo
    private exitedTo = new Subject<any>();
    // ionViewDidLeave
    private ionViewDidLeave = new Subject<any>();
    // splitPaneToggle:disable
    private splitPaneToggleDisable = new Subject<any>();
    // tocActiveSorting
    private tocActiveSorting = new Subject<any>();
    // sidemenu:redirect
    private sidemenuRedirect = new Subject<any>();
    // selectOneItem
    private selectOneItem = new Subject<any>();
    // tableOfContents:findMarkdownTocItem
    private tableOfContentsFindMarkdownTocItem = new Subject<any>();
    // UpdatePositionInPageRead
    private updatePositionInPageRead = new Subject<any>();
    // UpdatePositionInPageRead:TextChanger
    private updatePositionInPageReadTextChanger = new Subject<any>();
    // pageLoaded:about
    private pageLoadedAbout = new Subject<any>();
    // pageLoaded:content
    private pageLoadedContent = new Subject<any>();
    // pageLoaded:cover
    private pageLoadedCover = new Subject<any>();
    // pageLoaded:collections
    private pageLoadedCollections = new Subject<any>();
    // pageLoaded:featured-facsimiles
    private pageLoadedFeaturedFacsimiles = new Subject<any>();
    // pageLoaded:foreword
    private pageLoadedForeword = new Subject<any>();


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

    publishTableOfContentsUnSelectSelectedTocItem(data?: any) {
        this.tableOfContentsUnSelectSelectedTocItem.next(data);
    }

    getTableOfContentsUnSelectSelectedTocItem(): Subject<any> {
        return this.tableOfContentsUnSelectSelectedTocItem;
    }

    publishSelectedItemInMenu(data?: any) {
        this.selectedItemInMenu.next(data);
    }

    getSelectedItemInMenu(): Subject<any> {
        return this.selectedItemInMenu;
    }

    publishMusicAccordionSetSelected(data?: any) {
        this.musicAccordionSetSelected.next(data);
    }

    getMusicAccordionSetSelected(): Subject<any> {
        return this.musicAccordionSetSelected;
    }

    publishAboutMarkdownTOCLoaded(data?: any) {
        this.aboutMarkdownTOCLoaded.next(data);
    }

    getAboutMarkdownTOCLoaded(): Subject<any> {
        return this.aboutMarkdownTOCLoaded;
    }

    publishPdfviewOpen(data?: any) {
        this.pdfviewOpen.next(data);
    }

    getPdfviewOpen(): Subject<any> {
        return this.pdfviewOpen;
    }

    publishCollectionWithChildrenPdfsHighlight(data?: any) {
        this.collectionWithChildrenPdfsHighlight.next(data);
    }

    getCollectionWithChildrenPdfsHighlight(): Subject<any> {
        return this.collectionWithChildrenPdfsHighlight;
    }

    publishExitActiveCollection(data?: any) {
        this.exitActiveCollection.next(data);
    }

    getExitActiveCollection(): Subject<any> {
        return this.exitActiveCollection;
    }

    publishMusicAccordionReset(data?: any) {
        this.musicAccordionReset.next(data);
    }

    getMusicAccordionReset(): Subject<any> {
        return this.musicAccordionReset;
    }

    publishCollectionsAccordionChange(data?: any) {
        this.collectionsAccordionChange.next(data);
    }

    getCollectionsAccordionChange(): Subject<any> {
        return this.collectionsAccordionChange;
    }

    publishTypesAccordionChange(data?: any) {
        this.typesAccordionChange.next(data);
    }

    getTypesAccordionChange(): Subject<any> {
        return this.typesAccordionChange;
    }

    publishAboutAccordionChange(data?: any) {
        this.aboutAccordionChange.next(data);
    }

    getAboutAccordionChange(): Subject<any> {
        return this.aboutAccordionChange;
    }

    publishTableOfContentsLoaded(data?: any) {
        this.tableOfContentsLoaded.next(data);
    }

    getTableOfContentsLoaded(): Subject<any> {
        return this.tableOfContentsLoaded;
    }

    publishExitedTo(data?: any) {
        this.exitedTo.next(data);
    }

    getExitedTo(): Subject<any> {
        return this.exitedTo;
    }

    publishIonViewDidLeave(data?: any) {
        this.ionViewDidLeave.next(data);
    }

    getIonViewDidLeave(): Subject<any> {
        return this.ionViewDidLeave;
    }

    publishSplitPaneToggleDisable(data?: any) {
        this.splitPaneToggleDisable.next(data);
    }

    getSplitPaneToggleDisable(): Subject<any> {
        return this.splitPaneToggleDisable;
    }

    publishTocActiveSorting(data?: any) {
        this.tocActiveSorting.next(data);
    }

    getTocActiveSorting(): Subject<any> {
        return this.tocActiveSorting;
    }

    publishSidemenuRedirect(data?: any) {
        this.sidemenuRedirect.next(data);
    }

    getSidemenuRedirect(): Subject<any> {
        return this.sidemenuRedirect;
    }

    publishSelectOneItem(data?: any) {
        this.selectOneItem.next(data);
    }

    getSelectOneItem(): Subject<any> {
        return this.selectOneItem;
    }

    publishTableOfContentsFindMarkdownTocItem(data?: any) {
        this.tableOfContentsFindMarkdownTocItem.next(data);
    }

    getTableOfContentsFindMarkdownTocItem(): Subject<any> {
        return this.tableOfContentsFindMarkdownTocItem;
    }

    publishUpdatePositionInPageRead(data?: any) {
        this.updatePositionInPageRead.next(data);
    }

    getUpdatePositionInPageRead(): Subject<any> {
        return this.updatePositionInPageRead;
    }

    publishUpdatePositionInPageReadTextChanger(data?: any) {
        this.updatePositionInPageReadTextChanger.next(data);
    }

    getUpdatePositionInPageReadTextChanger(): Subject<any> {
        return this.updatePositionInPageReadTextChanger;
    }

    publishPageLoadedAbout(data?: any) {
        this.pageLoadedAbout.next(data);
    }

    getPageLoadedAbout(): Subject<any> {
        return this.pageLoadedAbout;
    }

    publishPageLoadedContent(data?: any) {
        this.pageLoadedContent.next(data);
    }

    getPageLoadedContent(): Subject<any> {
        return this.pageLoadedContent;
    }

    publishPageLoadedCover(data?: any) {
        this.pageLoadedCover.next(data);
    }

    getPageLoadedCover(): Subject<any> {
        return this.pageLoadedCover;
    }

    publishPageLoadedCollections(data?: any) {
        this.pageLoadedCollections.next(data);
    }

    getPageLoadedCollections(): Subject<any> {
        return this.pageLoadedCollections;
    }

    publishPageLoadedFeaturedFacsimiles(data?: any) {
        this.pageLoadedFeaturedFacsimiles.next(data);
    }

    getPageLoadedFeaturedFacsimiles(): Subject<any> {
        return this.pageLoadedFeaturedFacsimiles;
    }

    publishPageLoadedForeword(data?: any) {
        this.pageLoadedForeword.next(data);
    }

    getPageLoadedForeword(): Subject<any> {
        return this.pageLoadedForeword;
    }
}