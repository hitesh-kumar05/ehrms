import {Component, DestroyRef, inject, OnInit, ViewChild} from '@angular/core';
import {AuthService, EncryptionService, ErrorHandlerService, HttpService, MasterService} from "shared";
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'app-panjiyanlist',
  templateUrl: './panjiyanlist.component.html',
  styleUrl: './panjiyanlist.component.scss'
})
export class PanjiyanlistComponent implements OnInit {
  public totalRows: number = 0;
  public pageSize = 10;
  public currentPage = 0;
  public pageSizeOptions: number[] = [10, 50, 100, 500];
  is_read: boolean = false;
  reportName: any
  districtList: any = []
  tehsilList: any = []
  societyList: any = []
  public farmerList: any = [];
  user: any
  basicFormGroup!: FormGroup;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  destroyRef: any = inject(DestroyRef)
  displayedColumns: string[] = ['soceity', 'villcdname', 'uf_id', 'farmer_code', 'farmer_name', 'father_name', 'total_land', 'total_crop', 'paddy_crop', 'see'];

  constructor(private auth: AuthService, private http: HttpService, private err: ErrorHandlerService,
              private router: Router, private es: EncryptionService, private fb: FormBuilder, private master: MasterService) {
    this.user = this.auth.currentUser
    this.basicFormGroup = this.fb.group({
      district_id: [""],
      tehsil_id: [""],
      society_id: [""],
      search_value: [""],
      page: [this.currentPage, [Validators.required]],
      size: [this.pageSize, [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.getDistrict()
    this.validateSelection()
  }

  getReport() {
    this.http.postData('/report/post/panjiyanListRepost/', this.basicFormGroup.value, 'fetch').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (!res.body.error) {
        this.is_read = true;
        this.farmerList = new MatTableDataSource(res.body.data);
        this.paginator.pageIndex = 0;
        this.paginator.length = res.body.data.length;
        this.farmerList.paginator = this.paginator;
        this.farmerList.sort = this.sort;
      } else if (res.body.error.code == 'sc014') {
        this.farmerList = []
        this.paginator.pageIndex = 0;
        this.paginator.length = 0;
        this.farmerList.paginator = this.paginator;
      } else {
        this.is_read = false
      }
    })
  }

  resetChange(): void {
    this.currentPage = 0
    this.pageSize = 10
    this.basicFormGroup.patchValue({
      page: this.currentPage,
      size: this.pageSize
    })
  }

  pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.basicFormGroup.patchValue({
      page: this.currentPage,
      size: this.pageSize
    })
    this.getReport();
  }

  getDistrict() {
    this.master.getDistrict().then(res => {
      if (this.user.user_type == 10) {
        this.districtList = res.filter((d: any) => d.c_bank_code == this.user.user_id);
      } else {
        this.districtList = res;
      }

    })
  }

  getTehsil() {
    const district_id = this.basicFormGroup.controls['district_id'].value;
    if (district_id != '') {
      this.master.getTehsilByDistrict(district_id).then(res => {
        this.tehsilList = res;
      })
    }
  }

  getSociety() {
    const district_id = this.basicFormGroup.controls['district_id'].value;
    const tehsil_id = this.basicFormGroup.controls['tehsil_id'].value;
    this.master.getSociety(2, district_id, tehsil_id).then(res => {
      this.societyList = res;
    })
  }

  validateSelection() {
    const district_id = this.basicFormGroup.controls['district_id'].value;
    const tehsil_id = this.basicFormGroup.controls['tehsil_id'].value;
    const society_id = this.basicFormGroup.controls['society_id'].value;
    if (district_id == '') {
      this.basicFormGroup.controls['tehsil_id'].disable()
      this.basicFormGroup.controls['society_id'].disable()
      this.err.resetControlValue(this.basicFormGroup, ['tehsil_id', 'society_id', "search_value"], "")
    } else if (tehsil_id == '') {
      this.basicFormGroup.controls['tehsil_id'].enable()
      this.basicFormGroup.controls['society_id'].disable()
      this.err.resetControlValue(this.basicFormGroup, ['society_id', "search_value"], "")
    } else {
      this.err.resetControlValue(this.basicFormGroup, ["search_value"], "")
      this.basicFormGroup.controls['tehsil_id'].enable()
      this.basicFormGroup.controls['society_id'].enable()
    }
    if (society_id != '') {
      this.reportName = 'समिति ' + this.societyList.find((obj: any) => obj.Society_Id == society_id).Society_Name
    } else if (tehsil_id != '') {
      this.reportName = 'तहसील ' + this.tehsilList.find((obj: any) => obj.tehsil_id == tehsil_id).tehsil_name
    } else if (district_id != '') {
      this.reportName = 'जिला ' + this.districtList.find((obj: any) => obj.district_id == district_id).District_Name
    } else {
      this.reportName = ''
    }
    this.resetChange()
    this.getReport()
  }

  encryptAndNavigate(fs_id: number) {
    const valueToEncrypt: any = {fs_id: fs_id};
    const encData = this.es.encrypt(valueToEncrypt);
    this.router.navigate(['/report/receipt', encData]).then();
  }
}
