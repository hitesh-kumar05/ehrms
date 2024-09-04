import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {LoaderService} from "shared";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnInit, AfterViewInit {
  public isLoading: any;
  dotLoading: boolean = false;

  constructor(private loaderService: LoaderService, private changeDetector: ChangeDetectorRef) {
  }

  ngAfterViewInit() {
    this.loaderService.isLoading.subscribe(res => {
      this.isLoading = res;
      this.changeDetector.detectChanges();
    });
    this.loaderService.dotLoading.subscribe(res => {
      this.dotLoading = res;
      this.changeDetector.detectChanges();
    });
  }

  ngOnInit(): void {
  }
}
