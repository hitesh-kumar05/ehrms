import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {HttpService, AlertService, MasterService} from "shared";

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {
  userTypeList: any[] = [];
  user_id: number = 0;
  isShowDistrict: boolean = false;
  isShowTehsil: boolean = false;
  isShowSubdistrict: boolean = false;
  isShowUserId: boolean = false;
  isShowDivison: boolean = false;
  isShowBank: boolean = false;
  passResetForm!: FormGroup;
  districts: any[] = [];
  tehsils: any[] = [];
  subdistricts: any[] = [];
  divisons: any[] = [];
  coopBanks: any[] = [];
  subscriptions: Subscription[] = [];
  isValid: boolean = false;
  isRAEOorRHEO: string = '';
  destroyRef: any = inject(DestroyRef)

  constructor(private http: HttpService, private fb: FormBuilder,
              private alert: AlertService, private master: MasterService) {

  }

  ngOnInit(): void {
    this.createForm();
    this.getUsertype();
    this.getDistrict();
  }

  createForm() {
    let config = {
      district_id: [null],
      tehsil_id: [null],
      usertype: [null, [Validators.required]],
      subdistrict_code: [null],
      user_id: [null],
      div_id: [null],
      bank_id: [null],
    }
    this.passResetForm = this.fb.group(config);
  }

  getUsertype() {
    let url = `/admin/get/getUserTypeForPassResetOnAdmin`;
    this.http.getData(url, 'dept').subscribe((res: any) => {
      if (!res.body.error) {
        this.userTypeList = res.body.data;
      }
    })
  }

  getDistrict(): void {
    this.master.getDistrict().then(res => {
      this.districts = res
    })
  }

  getTehsil(district: number): void {
    this.master.getTehsilByDistrict(district).then(res => {
      this.tehsils = res;
    })
  }

  getSubdistrict(district_LGD: number) {
    const sub = this.http.getParam("/master/get/getSubDistrictListByDist/", {district_LGD: district_LGD}, 'common').subscribe(res => {
      this.subdistricts = !res.body.error && res.body.data.length > 0 ? res.body.data : [];
    });
    this.subscriptions.push(sub);
  }

  getDivison() {
    const sub = this.http.getData("/master/get/getMasDivison", 'common').subscribe(res => {
      this.divisons = !res.body.error && res.body.data.length > 0 ? res.body.data : [];
      console.log(res, 'sbd');
    });
    this.subscriptions.push(sub);
  }

  getCOOPBank() {
    const sub = this.http.getData("/master/get/getAllCOOPBanks", 'common').subscribe(res => {
      this.coopBanks = !res.body.error && res.body.data.length > 0 ? res.body.data : [];
      console.log(res, 'sbd');
    });
    this.subscriptions.push(sub);
  }

  userTypeSelected(event: any) {
    this.control('district_id').reset();
    this.control('tehsil_id').reset();
    this.control('subdistrict_code').reset();
    this.control('user_id').reset();
    this.control('div_id').reset();
    this.control('bank_id').reset();
    this.clearValidator('district_id')
    this.clearValidator('tehsil_id')
    this.clearValidator('subdistrict_code')
    this.clearValidator('user_id')
    this.clearValidator('div_id');
    this.clearValidator('bank_id');

    this.isShowDistrict = false;
    this.isShowUserId = false;
    this.isShowTehsil = false;
    this.isShowSubdistrict = false;
    this.isShowDivison = false;
    this.isShowBank = false;

    //tehsildaar
    if (event == 11 || event == 24 || event == 5 || event == 15 || event == 4 || event == 14) {
      this.setValidator('district_id');
      this.isShowDistrict = true;
    } else if (event == 6 || event == 12 || event == 26 || event == 7) {
      this.isRAEOorRHEO = this.userTypeList.find((e: any) => e["usertype"] == event)["type_name_hi"];
      this.setValidator('user_id');
      this.isShowUserId = true;
    }
      // else if(event == 12){
      //   this.setValidator('user_id');
      //   this.isRAEOorRHEO = this.userTypeList.find((e:any)=> e["usertype"] == event)["type_name_hi"];
      //   this.isShowUserId = true;
      // }
      // else if(event == 26){
      //   this.setValidator('user_id');
      //   this.isRAEOorRHEO = this.userTypeList.find((e:any)=> e["usertype"] == event)["type_name_hi"];
      //   this.isShowUserId = true;
    // }
    else if (event == 1 || event == 8 || event == 13 || event == 9) {

    } else if (event == 3) {
      this.setValidator('div_id');
      this.isShowDivison = true;
      this.getDivison()
    } else if (event == 10) {
      this.getCOOPBank();
      this.setValidator('user_id');
      this.setValidator('bank_id');
      this.isShowBank = true;
    }

  }

  districtSelected(event: any) {
    this.control('tehsil_id').reset();
    this.control('subdistrict_code').reset();
    this.control('user_id').reset();
    this.isShowSubdistrict = false;
    this.isShowTehsil = false;
    let LGD_Code = this.districts.find((e: any) => e["district_id"] == event)["LGD_Code"];
    // console.log(LGD_Code)
    let usertype = this.control('usertype').value;
    if (usertype == 11) {
      this.isShowSubdistrict = false;
      this.isShowTehsil = true;
      this.getTehsil(event);
      this.setValidator('tehsil_id');
    } else if (usertype == 24 || usertype == 4 || usertype == 14) {
      this.isShowSubdistrict = false;
      this.isShowTehsil = false;
    } else if (usertype == 5 || usertype == 15) {
      this.isShowSubdistrict = true;
      this.setValidator('subdistrict_code')
      this.isShowTehsil = false;
      this.getSubdistrict(LGD_Code);
    }
  }

  bankSelected(event: number) {
    if (event) {
      this.control('user_id').setValue(event);
    }
  }

  resetPassword() {
    if (this.passResetForm.invalid) {
      return this.passResetForm.markAllAsTouched();
    } else {
      let formValue = this.passResetForm.value;
      let usertypeName = ``;
      let userName = ``;
      let alertMessage = ``
      let bankName = ``;
      let {district_id, tehsil_id, usertype, subdistrict_code, user_id, div_id} = formValue;
      let data = {}, Case: number = 0;
      usertypeName = this.userTypeList.find((e: any) => e["usertype"] == usertype)["type_name_hi"];
      if ((usertype == 5 || usertype == 15) && usertype && district_id && subdistrict_code) {
        Case = 6
        data = {usertype, district_id, subdistrict_code, Case};
        userName = this.subdistricts.find((e: any) => e["subdistrict_code"] == subdistrict_code)["subdistrict_name"];
        alertMessage = `<b>क्या आप ${userName} : ${usertypeName} का पासवर्ड रीसेट करना चाहते है ?</b>`
      } else if ((usertype == 6 || usertype == 12 || usertype == 26 || usertype == 10 || usertype == 7) && usertype && user_id) {
        Case = 2
        data = {usertype, user_id, Case}

        if (usertype == 10) {
          userName = this.coopBanks.find((e: any) => e["c_bank_code"] == user_id)["c_bank_name"];
        } else {
          userName = user_id
        }
        alertMessage = `<b>क्या आप ${usertypeName} : ${userName} का पासवर्ड रीसेट करना चाहते है ?</b>`
      } else if (usertype == 11 && district_id && tehsil_id && usertype) {
        Case = 5
        data = {district_id, tehsil_id, usertype, Case}
        userName = this.tehsils.find((e: any) => e["tehsil_id"] == tehsil_id)["tehsil_name"];
        alertMessage = `<b>क्या आप ${userName} : ${usertypeName} का पासवर्ड रीसेट करना चाहते है ?</b>`
      } else if ((usertype == 24 || usertype == 4 || usertype == 14) && usertype && district_id) {
        Case = 4
        data = {usertype, district_id, Case}
        userName = this.districts.find((e: any) => e["district_id"] == district_id)["District_Name"];
        alertMessage = `<b>क्या आप ${userName} : ${usertypeName} का पासवर्ड रीसेट करना चाहते है ?</b>`
      }
      else if((usertype == 1 || usertype == 8 || usertype == 13 || usertype == 9 || usertype == 25)  && usertype) {
        Case = 1
        data = {usertype, Case}
        alertMessage = `<b>क्या आप ${usertypeName} का पासवर्ड रीसेट करना चाहते है ?</b>`
      } else if (usertype == 3 && usertype && div_id) {
        Case = 3
        data = {usertype, Case, div_id}
        userName = this.divisons.find((e: any) => e["div_id"] == div_id)["division_name_hi"];
        alertMessage = `<b>क्या आप ${userName} : ${usertypeName} का पासवर्ड रीसेट करना चाहते है ?</b>`
      } else {
        this.alert.alertMessage(`<b>यूजर का प्रकार अमान्य है | </b>`, '', 'warning');
        return;
      }

      if (data) {
        let url = `/security/login/resetPassword`;
        console.log(data, 'd')
        this.alert.confirmAlert(alertMessage, '', 'question').then((res: any) => {
          if (res.isConfirmed) {
            this.http.postData(url, data, 'common').subscribe((res: any) => {
              console.log(res);
              if (res.body.error) {
                this.alert.alertMessage(`<b>पासवर्ड रीसेट करने में समस्या आ रही हैं |</b>`, '', 'error');
              } else if (res.body.data && res.body.data.success && res.body.data.code == "PASSWORD_RESET_SUCCESSFULLY") {
                this.alert.alertMessage(`<b>पासवर्ड सफलतापूर्वक रीसेट किया गया |</b>`, '', 'success');
                this.reset();
              }
            })
          }
        })
      }
    }
  }

  control(field: string) {
    return this.passResetForm.controls[field];
  }

  setValidator(field: string) {
    this.control(field).setValidators(Validators.required);
    this.control(field).updateValueAndValidity();
  }

  clearValidator(field: string) {
    this.control(field).clearValidators();
    this.control(field).updateValueAndValidity();
  }

  reset() {
    this.control('district_id').reset();
    this.control('tehsil_id').reset();
    this.control('subdistrict_code').reset();
    this.control('user_id').reset();
    this.control('usertype').reset();
    this.control('div_id').reset();
    this.control('bank_id').reset();
    this.clearValidator('district_id')
    this.clearValidator('tehsil_id')
    this.clearValidator('subdistrict_code')
    this.clearValidator('user_id');
    this.clearValidator('div_id');
    this.clearValidator('bank_id');
    this.isShowDivison = false;
    this.isShowBank = false;
    this.isShowDistrict = false;
    this.isShowUserId = false;
    this.isShowTehsil = false;
    this.isShowSubdistrict = false;
  }
}
