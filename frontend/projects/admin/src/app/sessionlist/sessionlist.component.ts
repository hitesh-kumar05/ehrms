import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpService} from "shared"
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatPaginator, PageEvent} from "@angular/material/paginator";

@Component({
  selector: 'app-sessionlist',
  templateUrl: './sessionlist.component.html',
  styleUrls: ['./sessionlist.component.scss']
})
export class SessionlistComponent implements OnInit {
  sessions: any = []
  basicFormGroup!: FormGroup
  is_read: boolean = false;
  users: any = []
  public totalRows: number = 0;
  public pageSize: number = 10;
  public currentPage: number = 0;
  public pageSizeOptions: number[] = [10, 20, 50, 100];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpService, private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.createFilterForm()
    this.http.getData('/admin/get/getUserTypeForPassResetOnAdmin/', 'dept').subscribe(res => {
      !res.body.error ? this.users = res.body.data : [];
    })
    this.getData()
  }

  createFilterForm(): void {
    const config: any = {
      page: [this.currentPage, [Validators.required]],
      size: [this.pageSize, [Validators.required]],
      usertype: ["-1"],
      user_id: [""],
      season: ['24', [Validators.required]]
    }
    this.basicFormGroup = this.fb.group(config);
  }

  resetData(): void {
    this.basicFormGroup.patchValue({usertype: '-1'})
  }

  pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.basicFormGroup.patchValue({
      page: this.currentPage,
      size: this.pageSize
    })
    this.getData();
  }

  getData(): void {
    console.log('as')
    this.http.postData('/admin/post/showSessionList/', this.basicFormGroup.value, 'dept').subscribe(res => {
      if (!res.body.error) {
        this.sessions = res.body.data[0]
        this.paginator.length = res.body.data[1][0].total
        this.is_read = true;
      }
    })
  }

  terminate(user_id: any = '-1'): void {
    let json = {user_id: user_id, usertype: this.basicFormGroup.controls['usertype'].value}
    this.http.postData('/admin/post/terminateUserSession', json, 'dept').subscribe(res => {
      if (!res.body.error) {
        this.getData()
      }
    })
  }
}
