import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as XLSX from "xlsx";
import {AuthService, HttpService, PrintService, SharedModule} from "shared";
import {CommonModule} from "@angular/common";
import {Router} from "@angular/router";
import {take} from "rxjs";
import {MatTab, MatTabChangeEvent, MatTabContent, MatTabGroup} from "@angular/material/tabs";
import {ChartComponent} from "ngx-apexcharts";

let percentages: any = [];
let categories: any = [];

@Component({
  selector: 'app-panjiyanreport',
  templateUrl: './panjiyanreport.component.html',
  styleUrl: './panjiyanreport.component.scss',
  standalone: true,
  imports: [CommonModule, SharedModule, MatTab, MatTabContent, MatTabGroup, ChartComponent]
})
export class PanjiyanreportComponent implements OnInit, OnChanges {
  index: number = 0;
  @Input() reportData: any = []
  @Input() is_read: boolean = false;
  @Input() reportName: string = '';
  @Input() reportType: string = '';
  @ViewChild('print_content') print_content!: ElementRef;
  @ViewChild('table') table!: ElementRef;
  user: any
  public chartOptions: any;
  @ViewChild("chart") chart!: ChartComponent;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  constructor(private print: PrintService, private auth: AuthService, private router: Router,
              private http: HttpService) {
    this.user = this.auth.currentUser
    this.chartOptions = {
      series: [],
      chart: {
        height: 500,
        type: "bar",
        stacked: true,
        zoom: {
          enabled: true,
          type: 'xy',
          resetIcon: {
            offsetX: 10,
            offsetY: 10,
            fillColors: '#474747',
            strokeColor: '#37474F',
            strokeWidth: 1,
            shape: 'circle'
          },
          toolbar: {
            tools: {
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true
            },
            offsetX: -10,
            offsetY: 0
          }
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          dataLabels: {
            position: 'top',
          }
        }
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        formatter: function (val: any, opts: any) {
          const percentage = percentages[opts.dataPointIndex]?.toFixed(2);
          let p
          if (opts.seriesIndex === 3 && (percentages[opts.dataPointIndex] <= 100 || percentages[opts.dataPointIndex] >= 0)) {
            p = `${percentage}%`
          } else if (percentages[opts.dataPointIndex] == 100) {
            p = '100%'
          } else if (percentages[opts.dataPointIndex] == 0) {
            p = '0.00%'
          } else {
            p = ''
          }
          return p
        },
        style: {
          // fontSize: '9px',
          colors: ["blue"],
        },
      },
      yaxis: {},
      fill: {
        opacity: 1
      }
    };
  }

  ngOnInit(): void {
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.index = event.index
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.reportData && changes && changes['reportData']) {
      percentages = []
      categories = []
      this.processData(this.reportData)
    }
  }

  redirect(row: any): void {
    if (this.reportType == "जिलेवार") {
      this.router.navigate([`${this.getType()}panjiyan/`, row.District_Id]).then()
    }
    if (this.reportType == 'तहसीलवार') {
      this.router.navigate([`${this.getType()}panjiyan/`, row.District_Id, row.Block_Id]).then()
    }
    if (this.reportType == 'समितिवार') {
      this.router.navigate([`${this.getType()}panjiyan/`, row.District_Id, row.Block_Id, row.Society_Id]).then()
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
      case 11:
        return '/report/'
      default:
        this.auth.logout()
    }
  }

  printData(): void {
    let htmlContent = this.print_content.nativeElement.innerHTML;
    this.print.printHTML(htmlContent).then(() => {
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

  getPdf(): void {
    const html = this.print_content.nativeElement.innerHTML;
    this.http.postBlob(`/file/htmltoPdf/`, {
      html: html,
      orientation: 'landscape'
    }, null, 'common').pipe(take(1)).subscribe(() => {
      console.log("html to pdf")
    })
  }

  processData(data: any) {
    const series: any = [
      {
        name: "कैरी फॉरवर्ड",
        data: []
      },
      {
        name: "निरस्तीकरण हेतु प्रस्तावित",
        data: []
      },
      {
        name: "निरस्त किये गये",
        data: []
      },
      {
        name: "कैरी फॉरवर्ड हेतु बचे हुए",
        data: []
      }
    ]
    data.forEach((item: any) => {
      const rest = item.total_cf - (item.old_cf + item.old_request + item.new_deleted);
      percentages.push(item.cf_per)
      categories.push(item.name)
      series[0].data.push(item.old_cf)
      series[1].data.push(item.old_request)
      series[2].data.push(item.new_deleted)
      series[3].data.push(rest)
    })
    this.chartOptions.series = series
    this.chartOptions.xaxis = {
      type: "category",
      categories: categories,
      tickPlacement: 'on'
    }
    if (series.legend > 0) {
      this.chart.updateSeries(series)
    }
  }
}
