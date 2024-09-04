import {Component, OnInit} from '@angular/core';
import {HttpService} from "shared";

@Component({
    selector: 'app-applicationsize',
    templateUrl: './applicationsize.component.html',
    styleUrls: ['./applicationsize.component.scss']
})
export class ApplicationsizeComponent implements OnInit {
    process: any = []

    constructor(private http: HttpService) {
    }

    ngOnInit(): void {
        this.http.getData('/admin/get/checkApplicationSize','dept').subscribe(res => {
            this.process = res.body.data[0]
            console.log(this.process)
        })
    }
}
