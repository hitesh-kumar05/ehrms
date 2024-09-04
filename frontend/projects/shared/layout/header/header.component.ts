import {Component, Inject, OnInit} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {AuthService} from "shared";
import {MatDialog} from "@angular/material/dialog";
import {PasswordChangeComponent} from "../passwordchnage/passwordchnage.component";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  docElement!: HTMLElement;
  isFullScreen = false;

  constructor(@Inject(DOCUMENT) private document: Document, private auth: AuthService, private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.docElement = document.documentElement;
  }


  toggleSidebar(): void {
    this.document.body.classList.toggle('toggle-sidebar');
  }

  toggleFullScreen(): void {
    if (!this.isFullScreen) {
      this.docElement.requestFullscreen().then();
    } else {
      document.exitFullscreen().then();
    }
    this.isFullScreen = !this.isFullScreen;
  }

  signOut(): void {
    this.auth.logout()
  }

  changePassword(): void {
    const dialog: any = this.dialog.open(PasswordChangeComponent, {
      height: 'auto',
      width: '400px',
      hasBackdrop: true,
      data: {
        name: "password_change",
        user_id: this.auth.currentUser.user_id
      }
    });
    dialog.afterClosed().subscribe((res: any) => {
      if (res) {
        this.auth.logout()
      }
    });
  }
}
