import {Component, OnInit} from '@angular/core';
import {AuthService} from "shared";

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  constructor(private auth: AuthService) {

  }

  ngOnInit(): void {
  }

}
