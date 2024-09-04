import {Component, OnInit} from '@angular/core';
import {HttpService} from "shared";

@Component({
  selector: 'app-homelayout',
  templateUrl: './homelayout.component.html',
  styleUrl: './homelayout.component.scss'
})
export class HomelayoutComponent implements OnInit {
  readMore: boolean = false
  notifications: any = []

  constructor(private http: HttpService) {
  }

  ngOnInit(): void {
    this.getNotification()
  }

  getNotification() {
    this.http.getData("/outer/get/getNotification/", 'other').subscribe(res => {
      if (!res.body.error) {
        this.notifications = res.body.data;
      }
    })
  }

  purposeOfPortal: string[] = [
    'Human Resource Management System (HRMS) is a set of software that helps to manage human resource functions efficiently.',
    'Through this system, digital management of service records can be done, as well as reducing time and cost and improving access to digital records.',
    'Through this facility, on one hand, time will be saved and on the other hand, availability of digital records will also be easy, along with dashboard, real-time monitoring of employee deployment will also be easy.',
    'Along with this, delit information about reimbursement, claims, advance, leaves and other matters related to employees can also be obtained.',
    'Through e HRMS facility, dependence on traditional paper records and manual entry of data will be reduced and time will also be saved.'
  ];

  visibleItems: string[] = this.purposeOfPortal.slice(0, 2);
  showAll = false;

  toggleShow() {
    this.showAll = !this.showAll;
    this.visibleItems = this.showAll ? this.purposeOfPortal : this.purposeOfPortal.slice(0, 2);
  }
}
