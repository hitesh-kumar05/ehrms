import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AlertService, AuthService, ErrorHandlerService, HttpService} from "shared";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {environment} from "../../../../environments/environment.dev";

@Component({
  selector: 'app-userdetails',
  templateUrl: './userdetails.component.html',
  styleUrl: './userdetails.component.scss'
})
export class UserdetailsComponent implements OnInit {
  private env: any = environment
  public user: any;
  public usertype: any;
  public userDetailsFormGroup!: FormGroup;
  todayDate = new Date();
  public lableforname1 = ``;
  public lableformob1 = ``;
  public lableforname2 = ``;
  public lableformob2 = ``;
  public showSecondUserDetails : boolean = false;
  destroyRef = inject(DestroyRef)

  constructor(private fb: FormBuilder, private auth: AuthService, private http: HttpService, private error: ErrorHandlerService, private alert: AlertService) {
    this.user = this.auth.currentUser
    this.createForm();
  }

  ngOnInit() {
    this.getUserSetLabel();
  }

  createForm() {
    const config = {
      user_id: [this.user?.user_id, [Validators.required]],
      user_type: [this.user?.user_type, [Validators.required]],
      user1name : ['', [Validators.required, Validators.minLength(5), Validators.pattern('[A-z, ]{1,}')]],
      user2name : ['', []],
      user1mob : ['', [Validators.required, Validators.pattern('^(?!.*(\\d)\\1{4})(?:\\+91|0)?[6-9]\\d{9}$')]],
      user2mob : ['', []],
    };
    this.userDetailsFormGroup = this.fb.group(config);
  }

  getUserSetLabel(){
    this.usertype = this.user.user_type;
    switch (this.usertype) {
      case 3:
        this.showSecondUserDetails = false;
        this.lableforname1 = `संभाग (JDA) का नाम`;
        this.lableformob1 = `संभाग (JDA) का मो. न.`;
        break;
      case 4:
        this.showSecondUserDetails = true;
        this.lableforname1 = `जिला (DDA) का नाम`;
        this.lableformob1 = `जिला (DDA) का मो. न.`;
        this.lableforname2 = `जिला ऑपरेटर का नाम`;
        this.lableformob2 = `जिला ऑपरेटर का मो. न.`;
        break;
      case 5:
        this.showSecondUserDetails = false;
        this.lableforname1 = `विकासखण्ड (SADO) का नाम`;
        this.lableformob1 = `विकासखण्ड (SADO) का मो. न.`;
        break;
      case 6:
        this.showSecondUserDetails = false;
        this.lableforname1 = `RAEO का नाम`;
        this.lableformob1 = `RAEO का मो. न.`;
        break;
      case 7:
        this.showSecondUserDetails = true;
        this.lableforname1 = `समिति प्रबंधक का नाम`;
        this.lableformob1 = `समिति प्रबंधक का मो. न.`;
        this.lableforname2 = `समिति ऑपरेटर का नाम`;
        this.lableformob2 = `समिति ऑपरेटर का मो. न.`;
        break;
      case 10:
        this.showSecondUserDetails = false;
        this.lableforname1 = `नोडल अधिकारी का नाम`;
        this.lableformob1 = `नोडल अधिकारी का मो. न.`;
        break;
      case 11:
        this.showSecondUserDetails = true;
        this.lableforname1 = `तहसीलदार का नाम`;
        this.lableformob1 = `तहसीलदार का मो. न.`;
        this.lableforname2 = `तहसील ऑपरेटर का नाम`;
        this.lableformob2 = `तहसील ऑपरेटर का मो. न.`;
        break;
      case 24:
        this.showSecondUserDetails = true;
        this.lableforname1 = `कलेक्टर (DM) का नाम`;
        this.lableformob1 = `कलेक्टर (DM) का मो. न.`;
        this.lableforname2 = `ऑपरेटर का नाम`;
        this.lableformob2 = `ऑपरेटर का मो. न.`;
        break;
    }

    if(this.showSecondUserDetails){
      this.control('user2name').setValidators([Validators.required, Validators.minLength(5), Validators.pattern('[A-z, ]{1,}')]);
      this.control('user2mob').setValidators([Validators.required, Validators.pattern('^(?!.*(\\d)\\1{4})(?:\\+91|0)?[6-9]\\d{9}$')]);
    }
  }

  control(field: string): any {
    return this.userDetailsFormGroup.controls[field];
  }

  saveUserDetails(){
    if(this.userDetailsFormGroup.valid){
      let data = this.userDetailsFormGroup.value;
      if(data["user1name"].toString().trim() == data["user2name"].toString().trim()){
        this.alert.alertMessage(``, `${this.lableforname1} तथा ${this.lableforname2} समान नही हो सकता |`, 'error')
        return;
      }

      if(data["user1mob"].toString().trim() == data["user2mob"].toString().trim()){
        this.alert.alertMessage(``, `${this.lableformob1} तथा ${this.lableformob2} समान नही हो सकता | `, 'error')
        return;
      }

      let url = `/common/post/saveDeptInformation`;
      this.http.postData(url, data, 'common')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res : any) => {
          if(!res.body.error){
            this.alert.alertMessage(``, `जानकारी सफलतापूर्वक सुरक्षित किया गया`, 'success')
              .then((res1 : any) => {
                if(res1.isConfirmed){
                  this.redirect();
                  return;
                }
              })
          }
          else{
            this.alert.alertMessage(``, `जानकारी सुरक्षित करने में समस्या आ रही है!`, 'error');
            return;
          }
        })
    }
    else{
      this.userDetailsFormGroup.markAllAsTouched();
      this.userDetailsFormGroup.markAsDirty();
      return;
    }
  }

  logout() {
    this.auth.logout()
  }

  redirect() {
    const user_type = this.usertype;
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
      default:
        window.open(this.env.report, '_self');
        break;
    }
  }

}
