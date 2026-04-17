import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';
import { cvAccessGuard } from './core/guards/cv-access.guard';

export const routes: Routes = [
  //TODO: fix redirect to home after login
  //TODO: not redirect to home after trying to access a private CV without being authenticated
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./pages/login-page/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home-page/home-page').then((module) => module.HomePage),
  },
  {
    path: 'home/profiles/:profileId/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-editor-page/profile-editor-page').then((module) => module.ProfileEditorPage),
  },
  {
    path: 'home/templates',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/template-gallery-page/template-gallery-page').then((module) => module.TemplateGalleryPage),
  },
  {
    path: ':slug',
    canActivate: [cvAccessGuard],
    loadComponent: () => import('./pages/cv-shell-page/cv-shell-page').then((module) => module.CvShellPage),
  },
  {
    path: '*',
    pathMatch: 'full',
    loadComponent: () => import('./pages/root-redirect-page/root-redirect-page').then((module) => module.RootRedirectPage),
  },
];
