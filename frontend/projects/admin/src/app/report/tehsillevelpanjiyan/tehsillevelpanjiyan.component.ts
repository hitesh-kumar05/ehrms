import {Component, OnInit} from '@angular/core';
import {AuthService, HttpService, PrintService} from "shared";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-tehsillevelpanjiyan',
  templateUrl: './tehsillevelpanjiyan.component.html',
  styleUrl: './tehsillevelpanjiyan.component.scss'
})
export class TehsillevelpanjiyanComponent implements OnInit {
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
    if ([11].includes(user.user_type)) {
      this.getReport(user.district_id, user.tehsil_id)
    } else {
      this.route.params.subscribe((params: any) => {
        if (params && params['district_id'] && params['tehsil_id']) {
          this.getReport(params['district_id'], params['tehsil_id'])
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

  getReport(district_id: number, tehsil_id: string) {
    const param: any = {district_id: district_id, tehsil_id: tehsil_id}
    this.http.getParam(`/report/get/${this.getUrl()}/`, param, 'fetch').subscribe(res => {
      if (!res.body.error) {
        this.is_read = true;
        this.reportData = res.body.data;
      }
    })
  }
}
