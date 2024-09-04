import {Component, OnInit} from '@angular/core';
import {HttpService} from "shared";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
    selector: 'app-showprocesslist',
    templateUrl: './showprocesslist.component.html',
    styleUrls: ['./showprocesslist.component.scss']
})
export class ShowprocesslistComponent implements OnInit {
    process: any = [];
    basicFormGroup!: FormGroup

    constructor(private http: HttpService, private fb: FormBuilder) {
        this.basicFormGroup = this.fb.group({
            server: ["244"]
        })
    }

    ngOnInit(): void {
        this.getData()
    }

    getData(): void {
        this.http.getParam('/admin/get/processList/', this.basicFormGroup.value,'dept').subscribe((res: any) => {
            this.process = res.body.data;
        });
    }

    checkKill(info: any): boolean {
        if (info) {
            return info.includes('SELECT') && !info.includes('INSERT') && !info.includes('UPDATE');
        } else {
            return false
        }

    }


    killProcess(QUERY_ID: number, index: number) {
        let json: object = {server: this.basicFormGroup.controls['server'].value, query_id: QUERY_ID}
        this.http.postData('/admin/post/killProcess/', json, 'dept').subscribe(res => {
            this.process.splice(index, 1)
        })
    }
}
