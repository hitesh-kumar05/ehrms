import {Component, OnInit} from '@angular/core';
import Swal from "sweetalert2";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthService, ErrorHandlerService, HttpService} from "shared";
import {SubSink} from "subsink";
import CryptoJS from "crypto-js";
import {environment} from "../../../../environments/environment.dev";

@Component({
  selector: 'app-pswdreset',
  templateUrl: './pswdreset.component.html',
  styleUrl: './pswdreset.component.scss'
})
export class PswdresetComponent implements OnInit {

  constructor(private fb: FormBuilder, private auth: AuthService, private http: HttpService, private error: ErrorHandlerService) {
    this.user = this.auth.currentUser
    this.createForm()
  }

  psswordResetForm!: FormGroup;
  todayDate = new Date()
  subs = new SubSink();
  user: any;
  public passwordKey: any = environment.PASSWORD_SECRET_KEY;
  isCapsLockIsOn: boolean = false;
  regex = /(?=^.{8,15}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
  showPassword: boolean = false;

  ngOnInit(): void {
  }

  createForm() {
    const config = {
      user_id: [this.user?.user_id],
      password: ['', [Validators.required, Validators.pattern(this.regex)]],
      cpassword: ['', Validators.required]
    };
    const extra: any = {
      validator: [this.error.MatchingValidator('password', 'cpassword')]
    };
    this.psswordResetForm = this.fb.group(config, extra);
  }

  control(field: string): any {
    return this.psswordResetForm.controls[field]
  }

  capsLockDetect(e: any) {
    this.isCapsLockIsOn = e == 1;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  resetPassword() {
    if (!this.psswordResetForm.invalid) {
      const password = CryptoJS.AES.encrypt(this.psswordResetForm.value.password, this.passwordKey);
      this.psswordResetForm.patchValue({password: `${password}`, cpassword: `${password}`});
      this.subs.sink = this.auth.resetPassword(this.psswordResetForm.value).subscribe((res: any) => {
        if (!res.body.error) {
          Swal.fire('पासवर्ड सफलतापूर्वक बदल दिया गया है, कृपया पुनः लॉगिन करें |', '', 'success').then(() => {
            this.auth.logout();
          })
        } else {
          Swal.fire('पासवर्ड बदलने में समस्या आ  रही है|', '', 'error').then(() => {
            this.auth.logout();
          })
        }
      })
    } else {

    }
  }

  logout() {
    this.auth.logout()
  }
}
