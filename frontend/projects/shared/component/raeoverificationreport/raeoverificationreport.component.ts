import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {AuthService, HttpService, PrintService} from "shared";
import {Router} from "@angular/router";
import * as XLSX from "xlsx";
import {take} from "rxjs";

@Component({
  selector: 'app-verificationreport',
  templateUrl: './raeoverificationreport.component.html',
  styleUrl: './raeoverificationreport.component.scss',
})
export class VerificationReportComponent {
  @Input() reportData: any = []
  @Input() is_read: boolean = false;
  @Input() reportName: string = '';
  @Input() reportType: string = '';
  @ViewChild('print_content') print_content!: ElementRef;
  @ViewChild('table') table!: ElementRef;
  user: any

  constructor(private print: PrintService, private auth: AuthService, private router: Router, private http: HttpService) {
    this.user = this.auth.currentUser
    console.log(this.user)
  }


  redirect(row: any): void {
    if (this.reportType == "जिलेवार") {
      this.router.navigate([`${this.getType()}verification/`, row.District_Id]).then()
    }
    if (this.reportType == 'तहसीलवार') {
      this.router.navigate([`${this.getType()}verification/`, row.District_Id, row.Block_Id]).then()
    }
    if (this.reportType == 'समितिवार') {
      this.router.navigate([`${this.getType()}verification/`, row.District_Id, row.Block_Id, row.Society_Id]).then()
    }
  }

  getType(): any {
    const user_type: number = this.user.user_type;
    switch (user_type) {
      case 2:
        return '/report/'
      case 1:
      case 8:
      case 13:
      case 25:
        return '/state/'
      case 4:
      case 14:
      case 24:
        return '/dist/'
      case 5:
      case 15:
        return '/block/'
      case 3:
        return '/div/'
      case 9:
      case 10:
        return '/bank/'
      case 6:
      case 12:
        return '/raeo/'
      default:
        this.auth.logout()
    }
  }

  printData() {
    let htmlContent = this.print_content.nativeElement.innerHTML;
    this.print.printHTML(htmlContent).then((res) => {
      // if (res) this.fs_id = null
    }).catch((error) => {
      console.error('Print error:', error);
    });
  }

  export(): void {
    const htmlContent = this.table.nativeElement;
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(htmlContent);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `SocietyReport.xlsx`);
  }

  getPdf() {
    const html = this.print_content.nativeElement.innerHTML;
    this.http.postBlob(`/file/htmltoPdf/`, {
      html: html,
      orientation: 'portrait'
    }, null, 'common').pipe(take(1)).subscribe(res => {
      console.log("html to pdf")
    })
  }
}
