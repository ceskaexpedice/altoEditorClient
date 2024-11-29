import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit {

  constructor(private auth: AuthService,
              private route: ActivatedRoute,
              public router: Router) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const sessionState = params.get('session_state');
      const code = params.get('code');
      const target = localStorage.getItem('login.url') || '/';
      console.log(target)
      localStorage.removeItem('login.url');
      this.auth.keycloakAuth(code, (status: number) => {
        if (status == AuthService.AUTH_AUTHORIZED) {
          this.router.navigateByUrl(target);
        } else if (status == AuthService.AUTH_NOT_AUTHORIZED) {
          this.auth.logout('/login?failure=1');
        } else {
          this.router.navigateByUrl('/login?failure=2');
        }
      });
    });
  }

}
