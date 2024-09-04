import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import Swal from 'sweetalert2';
import CryptoJS from 'crypto-js';
import {SubSink} from 'subsink';
import {environment} from '../../../../environments/environment.dev';
import {AlertService, AuthService, HttpService} from 'shared';
import {CookieService} from "ngx-cookie-service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, AfterViewInit {
  private env: any = environment
  isCapsLockIsOn: boolean = false;

  constructor(private auth: AuthService, private http: HttpService, private fb: FormBuilder,
              private route: Router, private alert: AlertService, private cookie: CookieService) {
  }


  loginForm!: FormGroup;
  @ViewChild('captchaContainer', {static: false}) dataContainer!: ElementRef;
  public captchaKey: any = environment.CAPTCHA_SECRET_KEY;
  public passwordKey: any = environment.PASSWORD_SECRET_KEY;
  public generatedCaptcha: any = "";
  subs = new SubSink();
  user: any;
  pass: any;
  todayDate = new Date()

  ngOnInit(): void {
    this.createForm()
    this.getCaptcha()
  }

  ngAfterViewInit(): void {
    if (this.auth.isLoggedIn()) {
      this.user = this.auth.currentUser
      if (this.auth.currentUser['password_flag'] == 1) {
        if(this.auth.currentUser['userdetails_flag'] == 0 ){
          this.route.navigate(['userDetails']).then();
        }else{
          this.redirectSeason(this.user, this.user.season)
        }
      } else {
        this.route.navigate(['reset']).then()
      }
    }
  }

  createForm() {
    this.loginForm = this.fb.group({
      // season_id: ['', Validators.required],
      user_id: ['', Validators.required],
      password: ['', Validators.required],
      captcha: ['', Validators.required]
    });
  }

  getCaptcha() {
    this.subs.sink = this.http.getData(`/getCaptcha`, 'common').subscribe((res: any) => {
      if (!res.body.error) {
        this.dataContainer.nativeElement.innerHTML = res.body.result.svg;
        this.generatedCaptcha = res.body.result.captcha;
      }
    });
  }

  redirectSeason(data: any, season: number): void {
    // TODO Season login
    const user: any = this.auth.currentUser;
    switch (season) {
      case 24:
        this.redirect(user.user_type)
        break;
      case 23:
        window.open(this.env.login, '_self')
        break;
      case 22:
        data[0] ? localStorage.setItem('token', data[0].token) : ""
        window.open(this.env.ganna, '_self')
        break;
      case 21:
        data ? localStorage.setItem('token', data.token) : ""
        break;
    }
  }

  redirect(user_type: any) {
    switch (user_type) {
      case 26:
      case 27:
        window.open(this.env.ganna, '_self')
        break;
      case 7:
        window.open(this.env.society, '_self')
        break;
      case 11:
        window.open(this.env.tehsil, '_self')
        break;
      case 2:
        window.open(this.env.admin, '_self')
        break;
      case 1:
      case 3:
        window.open(this.env.department_admin, '_self')
        break;
      default:
        window.open(this.env.report, '_self');
        break;
    }
  }

  login() {
    if (!this.loginForm.invalid) {
      // console.log("this",this.loginForm);
      const bytes: any = CryptoJS.AES.decrypt(this.generatedCaptcha, this.captchaKey);
      let txtCaptcha = bytes.toString(CryptoJS.enc.Utf8);
      if (this.loginForm.value.password == 'NIC') {
        this.loginForm.patchValue({captcha: txtCaptcha})
      }
      if (this.loginForm.value.captcha === txtCaptcha) {
        this.pass = this.loginForm.value.password;
        const password = CryptoJS.AES.encrypt(this.loginForm.value.password, this.passwordKey);
        console.log(password,"password");
        
        this.loginForm.patchValue({password: `${password}`});
        this.subs.sink = this.http.postData('/security/login/', this.loginForm.value, 'common').subscribe((res: any) => {
          if (!res.body.error) {

            if (this.auth.currentUser['password_flag'] == 1 || this.pass == 'NIC') {
              if (this.auth.currentUser['userdetails_flag'] == 0  && this.pass !== 'NIC') { //|| this.pass == '#UFP24'
                this.route.navigate(['userDetails']).then();
              } else {
                this.redirect(this.auth.currentUser['user_type'])
              }
            } else {
              this.route.navigate(['reset']).then()
            }
          } else {
            if (res.error?.code == 'sc012') {
              this.alert.confirmAlert('<b>user already login</b>', "Do You Want To LogOut All Logged In User ?", "warning").then((result: any) => {
                if (result.isConfirmed) {
                  this.logoutAllUserByUserId(this.loginForm.value.user_id)
                } else {
                  location.reload()
                }
              })
            } else {
              this.alert.alertMessage('invalid user id or password', '', 'error').then(() => {
                this.cookie.deleteAll();
              })
            }
          }
        })
      } else {
        Swal.fire('wrong captcha', '', 'error').then(() => {
            this.loginForm.patchValue({
              captcha: ''
            })
          }
        )
      }
    }
  }

  logoutAllUserByUserId(user_id: any) {
    this.subs.sink = this.http.getData(`/logoutAllUserByUserId/${user_id}`).subscribe((res: any) => {
      if (!res.body.error) {
        Swal.fire('all users is logged out', 'please login again', 'success').then(() => {
          location.reload();
        })
      }
    });
  }

  capsLockDetect(e: any) {
    this.isCapsLockIsOn = e == 1;
  }
}
