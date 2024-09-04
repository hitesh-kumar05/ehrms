import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import { HttpService} from "shared";

@Component({
    selector: 'app-errorloglist',
    templateUrl: './errorloglist.component.html',
    styleUrls: ['./errorloglist.component.scss']
})
export class ErrorloglistComponent implements OnInit {
    is_read: boolean = false;
    dataSource: any = []
    public totalRows: number = 0;
    public pageSize: number = 10;
    public currentPage: number = 0;
    public pageSizeOptions: number[] = [10, 20, 50, 100];
    filterFormGroup!: FormGroup
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(private http: HttpService, private fb: FormBuilder) {

    }

    ngOnInit(): void {
        this.createFilterForm();
        this.getData();
    }

    createFilterForm(): void {
        const config: any = {
            page: [this.currentPage, [Validators.required]],
            size: [this.pageSize, [Validators.required]],
            user_id: [""]
        }
        this.filterFormGroup = this.fb.group(config);
    }

    getData(): void {
        this.is_read = false;
        this.http.getParam('/admin/get/errorLog/', this.filterFormGroup.value, 'dept').subscribe(res => {
            console.log(res)
            this.is_read = true;
            this.dataSource = res.body.data.data;
            this.totalRows = res.body.data.total;
        })
    }

    pageChanged(event: PageEvent) {
        this.pageSize = event.pageSize;
        this.currentPage = event.pageIndex;
        this.filterFormGroup.patchValue({
            page: this.currentPage,
            size: this.pageSize
        })
        this.getData();
    }
}
