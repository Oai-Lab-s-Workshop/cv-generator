import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home-page/home-page').then((module) => module.HomePage),
  },
  {
    path: ':slug',
    loadComponent: () => import('./pages/cv-shell-page/cv-shell-page').then((module) => module.CvShellPage),
  },
];
