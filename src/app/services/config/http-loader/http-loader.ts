import { HttpClient } from '@angular/common/http';
import { forwardRef, Inject, resolveForwardRef } from '@angular/core';
import { ConfigLoader } from '../core/config.loader';

export class ConfigHttpLoader implements ConfigLoader {
  constructor(
    @Inject(forwardRef(() => HttpClient)) private readonly http: HttpClient,
    private readonly endpoint: string = '/config.json'
  ) {}

  loadSettings(): any {
    return new Promise((resolve: any, reject: Function) => {
      const http = resolveForwardRef(this.http);

      console.log('----------------------------------------');
      console.log(this.endpoint);
      console.log('----------------------------------------');

      http
        .get(this.endpoint)
        .subscribe(resolve, () => reject('Endpoint unreachable!'));
    });
  }
}