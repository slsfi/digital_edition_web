import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';

import { Observable, tap } from 'rxjs';


/** Pass untouched request through to the next request handler. */
@Injectable()
export class NoopInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
        console.log('----------------------------------------');
        console.log(req.url.endsWith(".json"));
        console.log('----------------------------------------');
    if (req.url.endsWith(".json")) {
        // next.handle(req).pipe(
        //     tap((event) => {
        //         return;
        //     })
        // )
        // return next.handle(req).do((event: HttpEvent<any>) => { return })
    }
    return next.handle(req);
  }
}