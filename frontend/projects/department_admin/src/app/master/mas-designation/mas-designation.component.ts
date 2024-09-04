import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {EmailValidator, FormControl, FormBuilder, FormGroup, Validators,ReactiveFormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {aadharValidator, AlertService, AuthService, EncryptionService, HttpService} from "shared";
import {ActivatedRoute, Router} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {HttpParams} from "@angular/common/http";


@Component({
  selector: 'app-mas-designation',
  templateUrl: './mas-designation.component.html',
  styleUrl: './mas-designation.component.scss'
})
export class MasDesignationComponent implements OnInit {
  mainForm!: FormGroup;
   destroyRef: any = inject(DestroyRef)
   //for cast
   //castelist = [
   // {key: 1, value: 'general '},
    //{key: 2, value: 'obc '},
   //{key: 3, value: 'sc '},
   // {key: 4, value: 'st '},
  //]
  castelist: any = []         //aray
  religionlist:any = []

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private auth: AuthService,
    private alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private es: EncryptionService

  ) 
  {
    this.createForm()
    console.log(this.mainForm.value);
    
    
  }
//////////////////on load function///////////
  ngOnInit(): void {
   // const user = this.auth.currentUser
   // this.user = user;
   // this.checkValidTime();
   // this.getParam()

   
   this.getReport();
   this.getCaste();
   this.getreligion();
  
  }

  createForm() {
    this.mainForm = this.fb.group({
      
      designation_name_en: ['', [Validators.required, Validators.pattern('[A-z, ]{1,}')]],
      designation_name_hi: ['', [Validators.required]],
      name: ['', [Validators.required]],
      email_id: ['', [Validators.required,Validators.email]],
      gender: ['', [Validators.required]],
      section_name: ['', [Validators.required]],
      caste_code: ['', [Validators.required]],
      religion_code:['', [Validators.required]],
    })
    
  }

  
  updateNominneDetails() {
    console.log(this.mainForm.value)
    // if (this.mainForm.valid) {
    //   let farmerrepresentative: any = {}
    //   farmerrepresentative['TypeofPerson'] = this.mainForm.controls['nominee_type'].value
    //   farmerrepresentative['Name'] = this.mainForm.controls['designation_name'].value
    //   farmerrepresentative['Relation'] = this.mainForm.controls['nominee_relation'].value
    //   farmerrepresentative['AadharNo'] = this.mainForm.controls['nominee_aadhar_number'].value
    //   farmerrepresentative['society'] = this.mainForm.controls['society_id'].value
    //   farmerrepresentative['uf_id'] = this.mainForm.controls['uf_id'].value
    //   farmerrepresentative['fs_id'] = this.mainForm.controls['fs_id'].value
    //   farmerrepresentative['FarmerCode'] = this.mainForm.controls['farmer_code'].value
    //   farmerrepresentative['nominee_aadhar_ref'] = this.mainForm.controls['nominee_aadhar_ref'].value
      const sub = this.http.postData('/dept/post/saveDesignationDetails/', this.mainForm.value, 'dept').subscribe(res => {
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
  ongenderchange(){

  }
  oncastechange(){

  }

  onreligionchange(){
    
  }

  control(field: string): any {
    return this.mainForm.controls[field]
  }

  getReport() {
   
      this.http.getData('/master/get/getAllDesignation/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      console.log(res.body.data);
      
        // if (!res.body.error) {
      //   this.is_read = true;
      //   this.farmerList = new MatTableDataSource(res.body.data);
      //   this.paginator.pageIndex = 0;
      //   this.paginator.length = res.body.data.length;
      //   this.farmerList.paginator = this.paginator;
      //   this.farmerList.sort = this.sort;
      // } else if (res.body.error.code == 'sc014') {
      //   this.farmerList = []
      //   this.paginator.pageIndex = 0;
      //   this.paginator.length = 0;
      //   this.farmerList.paginator = this.paginator;
      // } else {
      //   this.is_read = false
      // }
    })
  }

  getCaste() {
   
    this.http.getData('/master/get/getAllCaste/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
    console.log(res.body.data);
    this.castelist = res.body.data;
  })
}
  getreligion() {
    
    this.http.getData('/master/get/getAllReligion/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
    console.log(res.body.data);
    this.religionlist = res.body.data;
  
  })
}


}
