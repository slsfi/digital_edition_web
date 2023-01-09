import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, App, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LanguageService } from '../../app/services/languages/language.service';
import { ConfigService } from '@ngx-config/core';

/**
 * Generated class for the DownloadsPage page.
 *
 * Lists things that user has downloaded to local storage.
 * Allows user to delete cached things such as: publications, persons, places etc.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'downloads-page',
  segment: 'downloads'
})
@Component({
  selector: 'page-downloads',
  templateUrl: 'downloads.html',
})
export class DownloadsPage {

  downloads: any = [];
  appName: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: Storage,
    private toastCtrl: ToastController,
    private app: App,
    protected langService: LanguageService,
    protected config: ConfigService,
    private events: Events
  ) {
    this.langService.getLanguage().subscribe((lang) => {
      this.appName = this.config.getSettings('app.name.' + lang);
    });

    this.getDownloads();
    console.log(this.downloads);
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  getDownloads() {
    return this.storage.keys()
      .then(keys => Promise.all(keys.map(
        key => {
          this.storage.get(key).then((value) => {
            if (key.includes('_title')) {
              const linkID = key.split('_title')[0];
              const item = {key: key, value: value, type: 'publication', linkID: linkID};
              this.downloads.push(item);
            }
            if (key === 'person-search' || key === 'place-search' || key === 'tag-search') {
              const item = {key: key, value: value, type: 'search'};
              this.downloads.push(item);
            }
          });
        }
      )));
  }

  clearAll() {
    for (const d of this.downloads) {
      this.delete(d);
    }
  }

  async delete(item) {
    if (item.type === 'publication') {
      await this.storage.keys()
      .then(keys => Promise.all(keys.map(
        async key => {
          await this.storage.get(key).then(async (value) => {
            if (key.includes(item.linkID)) {
              await this.storage.remove(key);
            }
          });
        }
      )));
      await this.removedFromCacheToast(item);
    } else if (item.type === 'search') {
      await this.storage.remove(item.key);
      await this.removedFromCacheToast(item);
    }
  }

  async removedFromCacheToast(item) {
    let status = '';

    await this.storage.get(item.key).then((content) => {
      if (content) {
        status = 'Item was not removed from cache';
      } else {
        for (const d of this.downloads) {
          if (d.key === item.key) {
            this.downloads.splice(this.downloads.indexOf(d), 1);
          }
        }
        status = 'Item was successfully removed from cache';
      }
    });

    const toast = await this.toastCtrl.create({
      message: status,
      duration: 3000,
      position: 'bottom'
    });

    await toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    await toast.present();
  }

}
