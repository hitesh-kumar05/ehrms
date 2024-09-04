import {Component, OnInit} from '@angular/core';
import { HttpService,AlertService} from "shared";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";
import {MatDialog} from "@angular/material/dialog";
import {MenuupdateformComponent} from "./menuupdateform/menuupdateform.component";

@Component({
    selector: 'app-menumaster',
    templateUrl: './menumaster.component.html',
    styleUrls: ['./menumaster.component.scss']
})
export class MenumasterComponent implements OnInit {
    users: any = []
    menus: any = []
    basicFormGroup!: FormGroup

    constructor(private http: HttpService, private fb: FormBuilder, private alert: AlertService, private dialog: MatDialog) {
        this.basicFormGroup = this.fb.group({
            usertype: ["-1", [Validators.required]]
        })
    }

    ngOnInit(): void {
        this.http.getData('/admin/get/getUserTypeForPassResetOnAdmin/', 'dept').subscribe(res => {
            !res.body.error ? this.users = res.body.data : [];
        })
        this.getData();
    }

    getData(): void {
        this.http.getParam('/admin/get/getMenuList/', this.basicFormGroup.value,'dept').subscribe(res => {
            !res.body.error ? this.menus = res.body.data : [];
        })
    }

    toggle(event: MatSlideToggleChange, menu_code: number) {
        const payload: object = {'menu_code': menu_code, 'status': event.checked}
        this.http.postData('/admin/post/disableActiveMenu/', payload,'dept').subscribe(res => {
        })
    }

    deleteMenu(menu_code: number, index: number): void {
        this.alert.confirmAlert('Are you sure?', '', 'question').then((res: any) => {
            if (res.isConfirmed) {
                this.http.deleteData(`/admin/deleteMenuUsingMenuCode/${menu_code}/`,'dept').subscribe(res => {
                    !res.body.error ? this.menus.splice(index, 1) : '';
                })
            }
        })
    }

    menuDialog(row: any): void {
        const dialogRef: any = this.dialog.open(MenuupdateformComponent, {
            width: '400px',
            height: 'auto',
            data: row
        });
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result && result.affectedRows == 1) {
                this.alert.alertMessage('Menu Updated...!', '', 'success')
            }
        });
    }
}
