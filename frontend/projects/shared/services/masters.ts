import {Injectable} from '@angular/core';
import {HttpParams} from "@angular/common/http";
import {HttpService} from "./http.service";

@Injectable({
  providedIn: 'root'
})
export class MasterService {


  constructor(private http: HttpService) {
  }

  getDistrict(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.getData('/master/get/getAllDistrict/', 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getTehsilByDistrict(district_id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let param: HttpParams = new HttpParams().set('district_id', district_id);
      this.http.getParam('/master/get/getTehsilByDistrict/', param, 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getVillageByDistrictAndTehsil(district_id: number, tehsil_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let param: HttpParams = new HttpParams().set('district_id', district_id).set('tehsil_id', tehsil_id);
      this.http.getParam('/master/get/getVillageByDistrictAndTehsil/', param, 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getNomineeRelation(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.getData('/master/get/getNomineeRelation/', 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getMasCasteWithSubCaste(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.getData('/master/get/getMasCasteWithSubCaste/', 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getVillageListBySociety(society_id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let param: HttpParams = new HttpParams().set('society_id', society_id);
      this.http.getParam('/master/get/getVillageListBySociety/', param, 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getAllBanks(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.getData('/master/get/getAllBanks/', 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getBankBranchByDistrictAndBank(district_id: number, bank_id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let param: HttpParams = new HttpParams().set('district_id', district_id).set('bank_id', bank_id);
      this.http.getParam('/master/get/getBankBranchByDistrictAndBank/', param, 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getSociety(whereKey: number, district_id: number, tehsil_id: string = ''): Promise<any> {
    return new Promise((resolve, reject) => {
      let param: HttpParams = new HttpParams().set('district_id', district_id).set('tehsil_id', tehsil_id)
        .set('whereKey', whereKey);
      this.http.getParam('/master/get/getSocietyList/', param, 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }

  getAllCrops(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.getData('/master/get/getAllCrop/', 'common').subscribe((res: any) => {
        if (!res.body.error) {
          resolve(res.body.data);
        } else {
          reject(res.body.error);
        }
      })
    })
  }
}
