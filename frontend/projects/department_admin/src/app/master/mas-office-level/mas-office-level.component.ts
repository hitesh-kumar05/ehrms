import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {EmailValidator, FormControl, FormBuilder, FormGroup, Validators,ReactiveFormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {aadharValidator, AlertService, AuthService, EncryptionService, HttpService} from "shared";
import {ActivatedRoute, Router} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {HttpParams} from "@angular/common/http";


@Component({
  selector: 'app-mas-office-level',
  templateUrl: './mas-office-level.component.html',
  styleUrl: './mas-office-level.component.scss'
})
export class MasOfficeLevelComponent implements OnInit {   ////////////////////step1////////////////
  mainForm!: FormGroup;

  constructor(            ///////////////////step3/////////////////////
 private fb: FormBuilder,
    private http: HttpService,
    private auth: AuthService,
    private alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private es: EncryptionService
  ){        

    this.createForm()
    console.log(this.mainForm.value);
    
    
  }

  control(field: string): any{                ///////////////////step6/////////////////////
    return this.mainForm.controls[field];
  }
  ngOnInit(): void {                   /////////////step2/////////////////////
    
  }


  createForm() {                ///////////////////step4/////////////////////
    this.mainForm = this.fb.group({
      
      office_level_name_en: ['', [Validators.required, Validators.pattern('[A-z, ]{1,}')]],
      office_level_name_hi: ['', [Validators.required]],

    })
    
  }



  addOfficeLevel() {                 ///////////////////step5/////////////////////
    console.log(this.mainForm.value)
   
      const sub = this.http.postData('/dept/post/saveOfficeLevelDetails/', this.mainForm.value, 'dept').subscribe(res => {
        if (!res.body.error) {
          this.alert.alertMessage('नॉमिनी सफलतापूर्वक संसोधित कर दिया गया हैं', '', 'success').then(() => {
            this.router.navigate(['/nominee_edit/']);
          })
        } else {
          if (res.body.error['code'] && res.body.error['code'] == 5) {
            let farmer_code = res.body.error['farmer_code'] ?? 'NA'
            this.alert.alertMessage(`इस कृषक ${farmer_code} का धान खरीदी हेतु टोकन जारी किया जा चूका है अतः नॉमिनी में संसोधन संभव नहीं है |`, '', 'error')
          } else {
            this.alert.alertMessage('नॉमिनी संसोधन में समस्या आ रही है ', '', 'error')
          }

        }
      })
      
  }
}
