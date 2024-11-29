import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule, Router, NavigationStart, UrlSegmentGroup } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, interval, Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AppConfiguration } from 'src/app/app-configuration';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {


  tokenHours: string;
  tokenMinutes: string;
  tokenSeconds: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService,
    public translator: TranslateService,
    private config: AppConfiguration) { }

  onLanguageChanged(lang: string) {
    //localStorage.setItem('lang', lang);
    this.translator.use(lang);
  }

  ngOnInit(): void {

    this.onLanguageChanged(this.config.defaultLang);

    interval(1000).subscribe(x => {
      if (AuthService.tokenDeadline) {

        function getDifference(date1: any, date2: any) {
          const diffInMs = Math.abs(date2 - date1);
          return diffInMs;
        }

        let diffInMs = Math.round(getDifference(new Date(), AuthService.tokenDeadline) / 1000);
        if (diffInMs > 0) {
          this.tokenHours = this.padTo2Digits(Math.trunc(diffInMs / (3600)));
          diffInMs = diffInMs % 3600
          this.tokenMinutes = this.padTo2Digits(Math.trunc(diffInMs / (60)));
          diffInMs = diffInMs % 60
          this.tokenSeconds = this.padTo2Digits(diffInMs);
          let time = this.tokenHours + ":" + this.tokenMinutes + ":" + this.tokenSeconds;
          if (time === '00:02:00') {
            // this.ui.showAlertSnackBar('snackbar.alert.tokenTimeExpireInfo');
          }
        } else {
          this.tokenHours = this.padTo2Digits(0);
          this.tokenMinutes = this.padTo2Digits(0);
          this.tokenSeconds = this.padTo2Digits(0);
          window.location.href = '/login';
        }
      } else {
        this.tokenHours = null;
        this.tokenMinutes = null;
        this.tokenSeconds = null;
      }
    });

  }

  private padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
  }

  getTokenDeadline() {
    if (AuthService.tokenDeadline) {
      return [
        this.padTo2Digits(AuthService.tokenDeadline.getHours()),
        this.padTo2Digits(AuthService.tokenDeadline.getMinutes()),
        this.padTo2Digits(AuthService.tokenDeadline.getSeconds()),
      ].join(':')
    } else return '';
  }

  logout() {
    this.auth.logout();
  }

  openUserInfoDialog() {
    // const dialogRef = this.dialog.open(UserInfoDialogComponent, {
    //   panelClass: 'app-user-info-dialog',
    //   width: '600px'
    // });
  }
}
