import {Component, DestroyRef, inject, OnInit, ViewChild, viewChild} from '@angular/core';
import {EmailValidator, FormControl, FormBuilder, FormGroup, Validators,ReactiveFormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {aadharValidator, AlertService, AuthService, EncryptionService, HttpService} from "shared";
import {ActivatedRoute, Router} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {HttpParams} from "@angular/common/http";
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';


@Component({
  selector: 'app-mas-office',
  templateUrl: './mas-office.component.html',
  styleUrl: './mas-office.component.scss',
})
export class MasOfficeComponent implements OnInit {
  mainForm!:FormGroup;
  destroyRef: any = inject(DestroyRef)

  officelevel:any=[]
  officetype:any=[]
  districts:any=[]
  block:any=[]
  officedetails=[]

  @ViewChild('paginator1') paginator!: MatPaginator;

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
  ngOnInit(): void {
    
    this.getofficelevel();
    this.getofficetype();
    this.getdistrict();
    this.getAllBlockt();
    this.getofficedetailsReport();
  }
  ngAfterViewInit(): void {
      // this.dataSource.paginator = this.paginator;
  }
  

  createForm() {                ///////////////////step4/////////////////////
    this.mainForm = this.fb.group({
      
      office_name_en: ['', [Validators.required, Validators.pattern('[A-z, ]{1,}')]],
      office_name_hi: ['', [Validators.required]],
      office_level_code: ['', [Validators.required,]],
      office_type_code: ['', [Validators.required]],
      district_code: ['', [Validators.required]],
      block_code: ['', [Validators.required]],
      office_address: ['', [Validators.required]],
    })
    
    }
    addOfficename() {                 ///////////////////step5/////////////////////
      console.log(this.mainForm.value)
     
        const sub = this.http.postData('/dept/post/saveOfficeDetails/', this.mainForm.value, 'dept').subscribe(res => {
          if (!res.body.error) {
            this.alert.alertMessage('नॉमिनी सफलतापूर्वक संसोधित कर दिया गया हैं', '', 'success').then(() => {
              //this.router.navigate(['/nominee_edit/'])
              this.getofficedetailsReport();
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
  onofficelevelchange(){

  }
  onofficetypechange(){

  }
  ondistrictchange(event:any){
    let httpParams = new HttpParams().set('district_code', event.value)
    this.http.getParam(`/master/get/getBlockByDistrict`, httpParams, 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res=>{
      console.log(res.body);
      if (!res.body.error) {
        this.block = res.body.data
      } else {
        this.alert.alertMessage("Data Not Found", '', 'worning', 'Ok')
      }

    })
  }
  onblockchange(){

  }
  getofficelevel() {
    
    this.http.getData('/master/get/getAllOfficeLevel/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
    console.log(res.body.data);
    this.officelevel = res.body.data;
  
  })
}
getofficetype() {
    
  this.http.getData('/master/get/getAllOfficeType/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
  console.log(res.body.data);
  this.officetype = res.body.data;

  })
}
getdistrict() {
    
  this.http.getData('/master/get/getAllDistricts/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
  console.log(res.body.data);
  this.districts = res.body.data;

  })
}

getAllBlockt() {
  
  this.http.getData('/master/get/getBlockByDistrict/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
  console.log(res.body.data);
  this.block = res.body.data;

  })
}
getofficedetailsReport() {
   
  this.http.getData('/master/get/getOfficeDetails/', 'common').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
  console.log(res.body.data);
  this.officedetails=res.body.data;
  this.dataSource=new MatTableDataSource(res.body.data);
  this.dataSource.paginator = this.paginator;
  console.log("officedetails",this.officedetails);

})
}
dataSource = new MatTableDataSource<any>([]);
displayedColumns: string[] = ['serial_no','office_name_en','office_name_hi','office_level_name_en','office_type_name_en','district_name_en','subdistrict_name','office_address'];



  applyFilter(event: any) {
    event = event.trim();
    event=event.toLowerCase();
    this.dataSource.filter=event;
    console.log("aa",this.dataSource)
   }
}
