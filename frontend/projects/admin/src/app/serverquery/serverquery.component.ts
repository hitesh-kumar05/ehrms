import {Component, OnInit} from '@angular/core';
import {HttpService} from "shared";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-serverquery',
  templateUrl: './serverquery.component.html',
  styleUrl: './serverquery.component.scss'
})
export class ServerqueryComponent implements OnInit {
  basicForm: FormGroup;
  results: any = []

  constructor(private http: HttpService, private fb: FormBuilder) {
    this.basicForm = this.fb.group({
      query: ["", Validators.required],
    })
  }

  ngOnInit(): void {
  }

  runQuery() {
    this.results = []
    if (this.basicForm.invalid) {
      this.basicForm.markAsUntouched()
      return
    }
    this.http.postData("", this.basicForm.value, "fetch").subscribe(res => {

    })
  }
}
