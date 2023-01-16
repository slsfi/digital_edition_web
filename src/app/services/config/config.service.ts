import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {

  constructor() {
  }

  getSettings(id: string): string | unknown {
    // return actual settings
    return 'asd';
  }
}
