import {Injectable} from '@angular/core';
import {BehaviorSubject, distinctUntilChanged, filter, map, Observable, Subject} from "rxjs";

export interface Data {
  uf_id: number;
  fs_id: number;
  farmer_code: string,
  farmer_name: string
}

@Injectable({
  providedIn: 'root'
})
export class DataSharedService {
  private keySubject = new BehaviorSubject<Data | null>(null);
  keyData$ = this.keySubject.asObservable();

  private prefetchSubject = new BehaviorSubject<Data | null>(null);
  prefetchData$ = this.prefetchSubject.asObservable();

  private landListSubject = new BehaviorSubject<Data | []>([]);
  landListData$ = this.landListSubject.asObservable();

  private formSubject = new BehaviorSubject<Data | []>([]);
  formSubmissionData$ = this.formSubject.asObservable();


  private varisanSubject = new BehaviorSubject<{}>({});

  // varisanData$ = this.varisanSubject.asObservable();

  updateVarisanData(key: string, value: any) {
    const currentData = this.varisanSubject.value;
    const newData = {...currentData, [key]: value};
    this.varisanSubject.next(newData);
  }

  getVarisanData(key: string): any {
    return this.varisanSubject.pipe(
      filter(data => !!data),
      map((data: any) => data ? data[key] : null),
      distinctUntilChanged()
    );
  }

  clearVarisanData() {
    this.varisanSubject.next({});
  }

  completeSubject() {
    this.varisanSubject.complete();
  }

  setKeyData(data: Data) {
    this.keySubject.next(data);
  }

  clearKeyData() {
    this.keySubject.next(null);
  }

  setPreFetch(data: Data) {
    this.prefetchSubject.next(data);
  }

  clearPreFetch() {
    this.prefetchSubject.next(null);
  }

  setlandList(data: Data) {
    this.landListSubject.next(data);
  }

  clearlandList() {
    this.landListSubject.next([]);
  }

  setFormDara(data: Data) {
    this.formSubject.next(data);
  }

  clearFormDara() {
    this.formSubject.next([]);
  }

}
