import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';
import { cvAccessGuard } from './core/guards/cv-access.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/root-redirect-page/root-redirect-page').then((module) => module.RootRedirectPage),
  },
  {
    path: 'desktop',
    loadComponent: () => import('./pages/desktop-home-page/desktop-home-page').then((module) => module.DesktopHomePage),
  },
  {
    path: 'desktop/users/setup',
    loadComponent: () => import('./pages/desktop-user-setup-page/desktop-user-setup-page').then((module) => module.DesktopUserSetupPage),
  },
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./pages/login-page/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'home',
    pathMatch: 'full',
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
    path: 'home/profile-material',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile-material-page/profile-material-page').then((module) => module.ProfileMaterialPage),
  },
  {
    path: 'home/account',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account-page/account-page').then((module) => module.AccountPage),
  },
  {
    path: 'home/tokens',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/token-management-page/token-management-page').then((module) => module.TokenManagementPage),
  },
  {
    path: 'home/templates',
    loadComponent: () => import('./pages/template-gallery-page/template-gallery-page').then((module) => module.TemplateGalleryPage),
  },
  {
    path: 'home/privacy',
    loadComponent: () => import('./pages/privacy-page/privacy-page').then((module) => module.PrivacyPage),
  },
  {
    path: ':slug',
    canActivate: [cvAccessGuard],
    loadComponent: () => import('./pages/cv-shell-page/cv-shell-page').then((module) => module.CvShellPage),
  },
  {
    path: '**',
    pathMatch: 'full',
    loadComponent: () => import('./pages/root-redirect-page/root-redirect-page').then((module) => module.RootRedirectPage),
  },
];
