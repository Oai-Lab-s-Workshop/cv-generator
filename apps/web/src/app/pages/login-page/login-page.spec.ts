import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { LoginPage } from './login-page';

class AuthServiceStub {
  readonly currentUser = signal(null);
  readonly isAuthenticated = computed(() => false);
  login = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
}

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useClass: AuthServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('redirects to home after successful login', async () => {
    const navigateByUrl = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.identity.set(' user@example.com ');
    component.password.set('password');

    await component.submit();

    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'password');
    expect(navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });
});
