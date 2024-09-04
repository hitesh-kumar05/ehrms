import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {HttpService} from "shared";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
    selector: 'app-menuupdateform',
    templateUrl: './menuupdateform.component.html',
    styleUrls: ['./menuupdateform.component.scss']
})
export class MenuupdateformComponent implements OnInit {
    data: any
    users: any = []
    basicFormGroup!: FormGroup
    parent_type: number = 0

    constructor(@Inject(MAT_DIALOG_DATA) data: any, public dialogRef: MatDialogRef<any>, private http: HttpService, private fb: FormBuilder) {
        this.createFormGroup()
        this.data = data;
    }

    ngOnInit(): void {
        this.http.getData('/admin/get/getUserTypeForPassResetOnAdmin/', 'dept').subscribe(res => {
            !res.body.error ? this.users = res.body.data : [];
        })
        if (this.data) {
            this.basicFormGroup.patchValue(this.data)
        }
    }

    createFormGroup(): void {
        this.basicFormGroup = this.fb.group({
            name: ['', [Validators.required]],
            route: ['', [Validators.required]],
            usertype: ['', [Validators.required]],
            menuOrder: ['', [Validators.required]],
            is_new: [null],
            icon: ['', [Validators.required]],
            children: [0],
            type: ['link'],
            menuCode: []
        })
    }

    saveMenu(): void {
        console.log(this.data)
        if (this.basicFormGroup.invalid) {
            this.basicFormGroup.markAllAsTouched()
            return
        }
        let url: string = ''
        !this.data ? url = '/admin/post/addNewMenu/' : url = '/admin/post/updateMenu/';
        this.http.postData(url, this.basicFormGroup.value,'dept').subscribe(res => {
            !res.body.error ? this.dialogRef.close(res.body.data) : '';
        })
    }
}
