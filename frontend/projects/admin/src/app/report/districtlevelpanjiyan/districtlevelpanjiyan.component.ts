import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AuthService, HttpService, PrintService} from "shared";
import * as XLSX from "xlsx";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-districtlevelpanjiyan',
  templateUrl: './districtlevelpanjiyan.component.html',
  styleUrl: './districtlevelpanjiyan.component.scss'
})
export class DistrictlevelpanjiyanComponent implements OnInit {
  is_read: boolean = false;
  reportData: any = [];
  public reportType: any;
  user: any = []

  constructor(private auth: AuthService, private http: HttpService, private route: ActivatedRoute) {
    this.user = this.auth.currentUser
    this.reportType = this.route.snapshot.url[0].path
  }

  ngOnInit(): void {
    const user: any = this.auth.currentUser
    if ([4, 14, 24].includes(user.user_type)) {
      this.getReport(user.district_id)
    } else {
      this.route.params.subscribe((params: any) => {
        if (params && params['district_id']) {
          this.getReport(params['district_id'])
        }
      })
    }
  }

  getUrl(): String {
    if (this.reportType == 'verification') {
      return 'raeoVarificationReport'
    } else {
      return 'panjiyanReport'
    }
  }

  getReport(district_id: number) {
    const param: any = {district_id: district_id}
    this.http.getParam(`/report/get/${this.getUrl()}/`, param, 'fetch').subscribe(res => {
      if (!res.body.error) {
        this.is_read = true;
        this.reportData = res.body.data;
      }
    })
  }
}
