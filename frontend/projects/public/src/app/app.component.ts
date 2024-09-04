import {Component, OnInit} from '@angular/core';
import {AuthService} from "shared";
import {environment} from "../../../environments/environment.dev";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'public';

  constructor(private auth: AuthService) {
    if (this.auth.isLoggedIn() && this.auth.currentUser.season == 24) {
      this.auth.refreshCookie()
    }
  }

  ngOnInit() {
    if (environment.production) {
      console.log = function () {
      };
    }
  }
}
