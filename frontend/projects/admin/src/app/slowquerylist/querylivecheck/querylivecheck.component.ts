import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpService} from "shared";

@Component({
    selector: 'app-querylivecheck',
    templateUrl: './querylivecheck.component.html',
    styleUrls: ['./querylivecheck.component.scss']
})
export class QuerylivecheckComponent implements OnInit {
    data: any = [];
    is_read: boolean = false;
    is_error: boolean = false;

    constructor(private route: ActivatedRoute, private http: HttpService) {
    }

    ngOnInit(): void {
        this.route.params.subscribe(param => {
            this.is_read = false;
            this.is_error = false;
            this.http.getParam(`/admin/get/checkQueryPerformance`,{s_id:param['sid']},'dept').subscribe(res => {
                if (!res.body.error) {
                    this.data = res.body.data;
                    this.is_read = true;
                } else {
                    this.is_error = true;
                }
            })
        })
    }

}
