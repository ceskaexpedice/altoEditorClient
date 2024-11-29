import { Routes } from '@angular/router';
import { EditingComponent } from './pages/editing/editing.component';
import { RevisionComponent } from './pages/revision/revision.component';
import { RevisionDetailComponent } from './pages/revision/revision-detail/revision-detail.component';
import { HomeComponent } from './pages/home/home.component';
import { ProcessManagementComponent } from './pages/process-management/process-management.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthComponent } from './pages/auth/auth.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent},
  { path: 'keycloak', component: AuthComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard]  },
  { path: 'revision', component: RevisionComponent, canActivate: [AuthGuard] },
  { path: 'process-management', component: ProcessManagementComponent, canActivate: [AuthGuard] },
  { path: ':pid', redirectTo: ':pid/editing', pathMatch: 'full' },
  { path: ':pid/editing', component: EditingComponent, canActivate: [AuthGuard] },
  { path: 'revision/:pid', component: RevisionDetailComponent, canActivate: [AuthGuard] }
];
