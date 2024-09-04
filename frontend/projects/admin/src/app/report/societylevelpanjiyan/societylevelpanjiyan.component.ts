import {Component, OnInit} from '@angular/core';
import {AuthService, HttpService} from "shared";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-societylevelpanjiyan',
  templateUrl: './societylevelpanjiyan.component.html',
  styleUrl: './societylevelpanjiyan.component.scss'
})
export class SocietylevelpanjiyanComponent implements OnInit {
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
    if ([7].includes(user.user_type)) {
      this.getReport(user.user_id)
    } else {
      this.route.params.subscribe((params: any) => {
        if (params && params['society_id']) {
          this.getReport(params['society_id'])
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

  getReport(society_id: number) {
    const param: any = {society_id: society_id}
    this.http.getParam(`/report/get/${this.getUrl()}/`, param, 'fetch').subscribe(res => {
      if (!res.body.error) {
        this.is_read = true;
        this.reportData = res.body.data;
      }
    })
  }
}
