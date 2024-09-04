import {Component, Inject, OnInit} from '@angular/core';
import {AuthService, DataSharedService, HttpService} from "shared";
import {Router} from "@angular/router";
import {DOCUMENT} from "@angular/common";
import {HttpParams} from "@angular/common/http";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  public menus: any = [];
  public user: any = [''];

  constructor(private http: HttpService, private auth: AuthService, private router: Router,
              @Inject(DOCUMENT) private document: Document, private data: DataSharedService) {

  }

  async ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.user = this.auth.currentUser
      await this.getMenu()
    }
  }

  getMenu() {
    return new Promise((resolve, reject) => {
      const params = new HttpParams().set('user_type', this.user.user_type)
      this.http.getParam('/master/get/getMenuByUser/', params, 'common').subscribe(data => {
        if (!data.body.error) {
          this.menus = data.body.data;
          const r = this.menus.map((obj: any) => obj['route'])
          sessionStorage.setItem('menu', r)
          resolve(this.menus)
        } else {
          reject(data.body.error)
        }
      });
    })
  }

  routeIsActive(routePath: string) {
    return this.router.url.includes(routePath);
  }

  checkSubmenu(submenu: any): any {
    const current = this.router.url + '/'
    const x = submenu.some(function (el: any) {
      return el.redirect === current
    })
    return !x;
  }

  selectMenu(): void {
    if (window.screen.width < 768) {
      this.document.body.classList.toggle('toggle-sidebar');
    }
  }
}
