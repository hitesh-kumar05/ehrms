import { Injectable, OnDestroy } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private ngUnsubscribe$ : Subject<void> = new Subject<void>();
  constructor() { }
  ngOnDestroy() {
    console.log('A');
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }

  getUnsubscribeSignal() {
    return this.ngUnsubscribe$.asObservable();
  }
}
