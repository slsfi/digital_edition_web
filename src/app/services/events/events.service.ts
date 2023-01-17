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
}