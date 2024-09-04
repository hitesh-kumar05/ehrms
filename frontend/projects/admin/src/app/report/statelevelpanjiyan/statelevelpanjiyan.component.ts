import {Component, OnInit} from '@angular/core';
import {AuthService, HttpService} from "shared";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-statelevelpanjiyan',
  templateUrl: './statelevelpanjiyan.component.html',
  styleUrl: './statelevelpanjiyan.component.scss'
})
export class StatelevelpanjiyanComponent implements OnInit {
  public is_read: boolean = false;
  public reportData: any;
  public reportType: any;

  constructor(private auth: AuthService, private http: HttpService, private route: ActivatedRoute) {
    this.reportType = this.route.snapshot.url[0].path
  }

  ngOnInit(): void {
    this.getReport()
  }

  getUrl(): String {
    if (this.reportType == 'verification') {
      return 'raeoVarificationReport'
    } else {
      return 'panjiyanReport'
    }
  }

  getReport() {
    this.http.getData(`/report/get/${this.getUrl()}/`, 'fetch').subscribe(res => {
      if (!res.body.error) {
        this.is_read = true;
        this.reportData = res.body.data;
      }
    })
  }
}
