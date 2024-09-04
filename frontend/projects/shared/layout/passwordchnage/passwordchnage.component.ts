import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import {environment} from "../../../environments/environment.dev";
import {ErrorHandlerService, HttpService} from "shared";

@Component({
  selector: 'app-passwordchnage',
  templateUrl: './passwordchnage.component.html',
  styleUrls: ['./passwordchnage.component.scss']
})
export class PasswordChangeComponent implements OnInit {
  public user_id: any
  public action: any
  basicFormGroup!: FormGroup
  isCapsLockIsOn: boolean = false;
  regex = /(?=^.{8,15}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
  showPassword: boolean = false;
  public passwordKey: any = environment.PASSWORD_SECRET_KEY;

  constructor(@Inject(MAT_DIALOG_DATA) data: any, private dialog: MatDialogRef<any>, private fb: FormBuilder, private http: HttpService, private error: ErrorHandlerService) {
    this.user_id = data.user_id;
    this.action = data.name;
  }


  ngOnInit(): void {
    this.createForm()
  }

  capsLockDetect(e: any) {
    this.isCapsLockIsOn = e == 1;
  }

  createForm() {
    const config = {
      user_id: [this.user_id],
      password: ['', [Validators.required, Validators.pattern(this.regex)]],
      cpassword: ['', Validators.required]
    };
    const extra: any = {
      validator: [this.error.MatchingValidator('password', 'cpassword')]
    };
    this.basicFormGroup = this.fb.group(config, extra);
  }

  control(field: string): any {
    return this.basicFormGroup.controls[field]
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  resetPassword() {
    if (this.basicFormGroup.invalid) {
      this.basicFormGroup.markAllAsTouched()
      return
    }
    const password: any = CryptoJS.AES.encrypt(this.basicFormGroup.value.password, this.passwordKey);
    this.basicFormGroup.patchValue({password: `${password}`, cpassword: `${password}`});
    this.http.postData('/security/login/changePassword', this.basicFormGroup.value, 'login').subscribe(res => {
      if (!res.body.error) {
        Swal.fire('पासवर्ड सफलतापूर्वक बदल दिया गया है, कृपया पुनः लॉगिन करें |', '', 'success').then(() => {
          this.dialog.close(true)
        })
      } else {
        Swal.fire('पासवर्ड बदलने में समस्या आ रही है|', '', 'warning').then(() => {
          this.dialog.close(false)
        })
      }
    })
  }

}
