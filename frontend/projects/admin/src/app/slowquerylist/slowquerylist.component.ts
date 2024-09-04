import {Component, OnInit, ViewChild} from '@angular/core';
import { HttpService} from "shared";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {Clipboard} from '@angular/cdk/clipboard';
import {MatSlideToggleChange} from "@angular/material/slide-toggle";

@Component({
    selector: 'app-slowquerylist',
    templateUrl: './slowquerylist.component.html',
    styleUrls: ['./slowquerylist.component.scss']
})
export class SlowquerylistComponent implements OnInit {
    is_read: boolean = false;
    dataSource: any = []
    public totalRows: number = 0;
    public pageSize: number = 10;
    public currentPage: number = 0;
    public pageSizeOptions: number[] = [10, 20, 50, 100];
    filterFormGroup!: FormGroup
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(private http: HttpService, private fb: FormBuilder, private clipboard: Clipboard) {
    }

    ngOnInit(): void {
        this.createFilterForm()
        this.getData()
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

    onCopySuccess(textToCopy: any): void {
        this.clipboard.copy(textToCopy);
    }

    createFilterForm(): void {
        const config: any = {
            page: [this.currentPage, [Validators.required]],
            size: [this.pageSize, [Validators.required]],
        }
        this.filterFormGroup = this.fb.group(config);

    }

    toggle(event: MatSlideToggleChange, staff_id: number): void {
        const payload: any = {'sid': staff_id, 'status': event.checked}
        this.http.postData('/admin/post/slowQueryStatus/', payload,'dept').subscribe(res => {
            console.log(res)
        })
    }

    getData(): void {
        this.is_read = false;
        this.http.getParam('/admin/get/slowQueryList/', this.filterFormGroup.value,'dept').subscribe(res => {
            this.is_read = true;
            this.dataSource = res.body.data.data;
            this.totalRows = res.body.data.total;
        })
    }

    checkExplain(query: any): boolean {
        return !!(query.includes('insert into') || query.includes('UPDATE', 'SET'));
    }
}
