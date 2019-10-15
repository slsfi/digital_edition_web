import { TextService } from '../texts/text.service';
import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

/**
 * A service for caching publication in local storage.
 * Stores each view/version of a publication.
 */

@Injectable()
export class PublicationCacheService {
    constructor(public storage: Storage,
                public textService: TextService,
                private toastCtrl: ToastController
    ) {
    }

    async cachePublication(collectionID: string, publicationID: string, title: string) {
        const id = collectionID + '_' + publicationID;
        this.storage.set(id + '_title', title);
        await this.setEstablished(id);
        await this.setManuscripts(id);
        await this.setVariations(id);
    }

    setManuscripts(id: string) {
       this.textService.getManuscripts(id).subscribe(
            res => {
                this.storage.set(id + '_ms', res.manuscripts);
              },
              err => console.error(err)
        );
    }

    setVariations(id: string) {
        this.textService.getVariations(id).subscribe(
            res => {
                this.storage.set(id + '_var', res.variations);
              },
              err => console.error(err)
        );
    }

    setEstablished(id: string) {
        this.textService.getEstablishedText(id).subscribe(
            text => {
                this.storage.set(id + '_est', text);
              },
              err => console.error(err)
          );
    }

    setCommentary() {
        //
    }

    async removeFromCache(collectionID, publicationID) {
        const id = collectionID + '_' + publicationID;
        const types = ['est', 'ms', 'var'];

        for (let i = 0; i < types.length; i++) {
            await this.storage.remove(id + '_' + types[i]);
        }
    }

}
