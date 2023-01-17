import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { LanguageService } from '../languages/language.service';

/*
  Generated class for the MetadataService provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MetadataService {
  private siteMetadata: Object | any;
  private appName?: String;
  constructor(private config: ConfigService, private languageService: LanguageService) {
    try {
      this.siteMetadata = this.config.getSettings('siteMetaData') as Object;
    } catch (e) {
      this.siteMetadata = {};
    }
  }

  clearHead() {
    // Try to remove all META-Informaiton
    this.removeDescription();
    this.removeKeywords();
    this.removeStructuredData();
    // Add standard structured data
    this.addStructuredDataWebSite();
    this.addStructuredDataOrganisation();
  }

  removeDescription() {
    // Try to remove META-Tags
    try {
      document.querySelector('meta[name=\'description\']')?.remove();
    } catch (e) {

    }
  }

  addDescription(content?: any) {
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.appName = this.config.getSettings('app.name.' + lang) as string;
      // Add the new META-Tags
      const description = document.createElement('meta');
      description.name = 'description';
      if ( !content ) {
        description.content = this.appName + ' - ' + this.siteMetadata['description'];
      } else {
        description.content = this.appName + ' - ' + content;
      }
      document.getElementsByTagName('head')[0].appendChild(description);
    });
  }

  removeKeywords() {
    // Try to remove META-Tags
    try {
      document.querySelector('meta[name=\'keywords\']')?.remove();
    } catch (e) {

    }
  }

  addKeywords(content?: any) {
    const keywords = document.createElement('meta');
    keywords.name = 'keywords';
    if ( !content ) {
      keywords.content = this.siteMetadata['keywords'];
    } else {
      keywords.content = content;
    }
    document.getElementsByTagName('head')[0].appendChild(keywords);
  }

  removeStructuredData() {
    // Remove all Structured Data
    try {
      while (document.querySelector('script[type=\'application/ld+json\']')) {
        document.querySelector('script[type=\'application/ld+json\']')?.remove();
      }
    } catch (e) {

    }
  }

  addStructuredDataWebSite() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerText = JSON.stringify(this.siteMetadata['website']);
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  addStructuredDataOrganisation() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerText = JSON.stringify(this.siteMetadata['organization']);
    document.getElementsByTagName('head')[0].appendChild(script);
  }
}
