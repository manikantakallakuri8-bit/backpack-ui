import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonTab,
  IonItem,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonHeader,
  IonToolbar,
  ToastController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logIn, personAdd } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonTab,
    IonItem,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  @ViewChild('tabs', { static: false }) tabs: any;

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loginLoading = false;
  registerLoading = false;
  loginError: string | null = null;
  registerError: string | null = null;

  roles = [
    { label: 'Operative', value: 'operative' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'QS', value: 'qs' },
  ];

  operativeTypes = [
    { label: 'Street Lighting', value: 'street_lighting' },
    { label: 'Civils', value: 'civils' },
    { label: 'HIAB', value: 'hiab' },
    { label: 'Electrician', value: 'electrician' },
    { label: 'ICP Jointer', value: 'icp_jointer' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ logIn, personAdd });
  }

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['operative', Validators.required],
      operative_type: ['street_lighting'],
    });
  }

  get operativeTypeVisible(): boolean {
    return this.registerForm.get('role')?.value === 'operative';
  }

  async onLoginSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.loginLoading = true;
    this.loginError = null;

    const credentials = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value,
    };

    this.authService.login(credentials).subscribe({
      next: async (response) => {
        this.loginLoading = false;
        const toast = await this.toastController.create({
          message: `Welcome back, ${response.name}!`,
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        await toast.present();
        this.router.navigate(['/home']);
      },
      error: async (error) => {
        this.loginLoading = false;
        this.loginError = error.error?.message || 'Login failed. Please check your credentials.';
        const toast = await this.toastController.create({
          message: "Login failed. Please check your credentials.",
          duration: 3000,
          position: 'top',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  async onRegisterSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.registerLoading = true;
    this.registerError = null;

    const registerData = {
      name: this.registerForm.get('name')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
      role: this.registerForm.get('role')?.value,
    };

    // Only include operative_type if role is operative
    if (registerData.role === 'operative') {
      (registerData as any).operative_type = this.registerForm.get('operative_type')?.value;
    }

    this.authService.register(registerData).subscribe({
      next: async (response) => {
        this.registerLoading = false;
        const toast = await this.toastController.create({
          message: 'Registration successful! Please login.',
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        await toast.present();
        this.registerForm.reset({ role: 'operative', operative_type: 'street_lighting' });
        // Switch to login tab
        if (this.tabs) {
          this.tabs.select('login');
        }
      },
      error: async (error) => {
        this.registerLoading = false;
        this.registerError = error.error?.message || 'Registration failed. Please try again.';
        const toast = await this.toastController.create({
          message: "Registration failed. Please try again.",
          duration: 3000,
          position: 'top',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string | null {
    const field = form.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return null;
  }
}
