import {Component, ElementRef, HostListener, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import Swal from "sweetalert2";

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileuploadComponent,
      multi: true
    }
  ]
})
export class FileuploadComponent implements ControlValueAccessor {
  @Input() progress: any;
  // @ts-ignore
  onChange: Function;
  public file: File | null = null;

  @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
    const file: any = event && event.item(0);
    if (file.size > 500 * 1024) {
      Swal.fire('पीडीएफ फाइल की साइज 500KB से ज्यादा है', '', 'warning');
    } else if (file.type != 'application/pdf') {
      Swal.fire('कृपया पीडीएफ फाइल चुने ', '', 'warning');
    } else {
      this.onChange(file);
      this.file = file;
    }
  }

  constructor(private host: ElementRef<HTMLInputElement>) {
  }

  writeValue(value: null) {
    // clear file input
    this.host.nativeElement.value = '';
    this.file = null;
  }

  registerOnChange(fn: Function) {
    this.onChange = fn;
  }

  registerOnTouched(fn: Function) {
  }
}
