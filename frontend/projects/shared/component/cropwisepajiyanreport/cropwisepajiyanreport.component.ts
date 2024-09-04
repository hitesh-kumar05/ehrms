import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {AuthService, HttpService, MasterService, PrintService} from "shared";
import * as XLSX from "xlsx";
import {take} from "rxjs";
import {MatTabChangeEvent, MatTabGroup} from "@angular/material/tabs";
import {ChartComponent} from "ngx-apexcharts";

@Component({
  selector: 'app-cropwisepajiyanreport',
  templateUrl: './cropwisepajiyanreport.component.html',
  styleUrl: './cropwisepajiyanreport.component.scss'
})
export class CropwisepajiyanreportComponent implements OnInit, OnChanges {
  index: number = 0;

  @Input() reportData: any = []
  @Input() is_read: boolean = false;
  @Input() reportName: string = '';
  @ViewChild('print_content') print_content!: ElementRef;
  @ViewChild('table') table!: ElementRef;
  user: any
  public chartOptions: any;
  @ViewChild("chart") chart!: ChartComponent;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  constructor(private print: PrintService, private auth: AuthService, private http: HttpService, private master: MasterService) {
    this.user = this.auth.currentUser
    this.chartOptions = {
      series: [
        {
          data: [
            {
              x: "New Delhi",
              y: 218
            },
            {
              x: "Kolkata",
              y: 149
            },
            {
              x: "Mumbai",
              y: 184
            },
            {
              x: "Ahmedabad",
              y: 55
            },
            {
              x: "Bangaluru",
              y: 84
            },
            {
              x: "Pune",
              y: 31
            },
            {
              x: "Chennai",
              y: 70
            },
            {
              x: "Jaipur",
              y: 30
            },
            {
              x: "Surat",
              y: 44
            },
            {
              x: "Hyderabad",
              y: 68
            },
            {
              x: "Lucknow",
              y: 28
            },
            {
              x: "Indore",
              y: 19
            },
            {
              x: "Kanpur",
              y: 29
            }
          ]
        }
      ],
      legend: {
        show: false
      },
      chart: {
        height: 350,
        width: 600,
        type: "treemap"
      },
      title: {
        text: "फसलवार पंजीयन रिपोर्ट",
        align: "center"
      },
      plotOptions: {
        treemap: {
          distributed: true,
          enableShades: false
        }
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
      this.processData(this.reportData)
    }
  }

  processData(data: any) {
    const series: any = []
    // const labels: any = []
    data.forEach((item: any) => {
      if(item.name != "धान"){
        series.push({
          x: item.name,
          y: item.total_area
        })
        // series.push(item.total_area);
        // labels.push(item.name)
      }
    })
    // this.chartOptions.series = series
    // this.chartOptions.labels = labels
    this.chartOptions.series = [{data: series}]
    if (series.legend > 0) {
      this.chart.updateSeries(series)
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
}
