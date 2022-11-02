import { Injectable } from '@angular/core';

@Injectable()
export class CommonFunctionsService {

  constructor() {
  }

  /**
   * Check if a file is found behind the given url.
   */
  async urlExists(url: string) {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok && response.status !== 404) {
      return true;
    } else {
      return false;
    }
  }
}
