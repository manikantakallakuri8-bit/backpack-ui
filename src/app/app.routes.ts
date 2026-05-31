import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'supervisor',
    loadComponent: () =>
      import('./supervisor/supervisor.page').then((m) => m.SupervisorPage),
  },
  {
    path: 'operative',
    loadComponent: () =>
      import('./operative/operative.page').then((m) => m.OperativePage),
  },
  {
    path: 'qs',
    loadComponent: () =>
      import('./qs/qs.page').then((m) => m.QsPage),
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
