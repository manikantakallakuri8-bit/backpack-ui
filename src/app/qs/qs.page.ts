import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonCard,
  IonCardContent,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButtons,
  IonText,
  IonLoading,
  IonToast,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut } from 'ionicons/icons';
import { environment } from '../../environments/environment';

interface CompletedJob {
  id: string;
  title: string;
  location: string;
  job_type: string;
  assigned_operatives: Array<{
    id: string;
    name: string;
  }>;
  log?: {
    vehicles: Array<{
      vehicle_type: string;
      registration: string;
      arrival_time: string;
    }>;
    plant_items: Array<{
      item_name: string;
      quantity: number;
      price_per_unit: number;
    }>;
    materials: Array<{
      item_name: string;
      quantity: number;
      price_per_unit: number;
    }>;
    notes?: string;
    hours_on_site?: number;
    labour_cost?: number;
  };
}

interface AIAnalysis {
  analysis: string;
}

interface OperativeData {
  id: string;
  name: string;
  operative_type: string;
  pay_rate?: number;
}

interface SupervisorData {
  id: string;
  name: string;
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  operative_type?: string;
  pay_rate?: number;
  role: string;
}

@Component({
  selector: 'app-qs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonCard,
    IonCardContent,
    IonModal,
    IonInput,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButtons,
    IonText,
    IonLoading,
    IonToast,
    IonSpinner,
  ],
  templateUrl: './qs.page.html',
  styleUrls: ['./qs.page.scss'],
})
export class QsPage implements OnInit {
  selectedTab: 'completed_jobs' | 'team' = 'completed_jobs';
  selectedTeamTab: 'operatives' | 'supervisors' = 'operatives';

  completedJobs: CompletedJob[] = [];
  operatives: OperativeData[] = [];
  supervisors: SupervisorData[] = [];
  allUsers: User[] = [];

  selectedJob: CompletedJob | null = null;
  showCostSummaryModal = false;
  showAddSupervisorModal = false;

  isLoading = false;
  showToast = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  aiAnalysis: string = '';
  isLoadingAI: boolean = false;

  addSupervisorForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController
  ) {
    addIcons({ logOut });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCompletedJobs();
  }

  private initializeForm(): void {
    this.addSupervisorForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  onTabChange(event: any): void {
    const value = event.detail.value;
    if (value === 'completed_jobs' || value === 'team') {
      this.selectedTab = value;
      if (value === 'team') {
        this.loadAllUsers();
      }
    }
  }

  onTeamTabChange(event: any): void {
    const value = event.detail.value;
    if (value === 'operatives' || value === 'supervisors') {
      this.selectedTeamTab = value;
    }
  }

  loadCompletedJobs(): void {
    this.isLoading = true;
    this.http
      .get<CompletedJob[]>(`${environment.apiUrl}/qs/jobs/completed`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.completedJobs = response;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading completed jobs:', error);
          this.isLoading = false;
          this.showErrorToast('Failed to load completed jobs');
        },
      });
  }

  loadAllUsers(): void {
    this.isLoading = true;
    this.http
      .get<User[]>(`${environment.apiUrl}/users/all`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.allUsers = response;
          this.separateUsers();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoading = false;
          this.showErrorToast('Failed to load users');
        },
      });
  }

  private separateUsers(): void {
    this.operatives = this.allUsers
      .filter((u) => u.role === 'operative')
      .map((u) => ({
        id: u.id,
        name: u.name,
        operative_type: u.operative_type || '',
        pay_rate: u.pay_rate,
      }));

    this.supervisors = this.allUsers
      .filter((u) => u.role === 'supervisor')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }));
  }

  openCostSummaryModal(job: CompletedJob): void {
    this.selectedJob = job;
    this.aiAnalysis = '';
    this.loadAIAnalysis(job);
    this.showCostSummaryModal = true;
  }

  closeCostSummaryModal(): void {
    this.showCostSummaryModal = false;
    this.selectedJob = null;
    this.aiAnalysis = '';
  }

  openAddSupervisorModal(): void {
    this.addSupervisorForm.reset();
    this.showAddSupervisorModal = true;
  }

  closeAddSupervisorModal(): void {
    this.showAddSupervisorModal = false;
    this.addSupervisorForm.reset();
  }

  submitAddSupervisor(): void {
    if (this.addSupervisorForm.invalid) {
      return;
    }

    const formData = {
      name: this.addSupervisorForm.get('name')?.value,
      email: this.addSupervisorForm.get('email')?.value,
      password: this.addSupervisorForm.get('password')?.value,
      role: 'supervisor',
    };

    this.isLoading = true;
    this.http
      .post<any>(`${environment.apiUrl}/register`, formData, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.loadAllUsers();
          this.closeAddSupervisorModal();
          this.showSuccessToast('Supervisor added successfully');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error adding supervisor:', error);
          this.isLoading = false;
          this.showErrorToast('Failed to add supervisor');
        },
      });
  }

  calculatePlantToolsTotal(): number {
    if (!this.selectedJob?.log?.plant_items) return 0;
    return this.selectedJob.log.plant_items.reduce((total, item) => {
      return total + (item.quantity * item.price_per_unit || 0);
    }, 0);
  }

  calculateMaterialsTotal(): number {
    if (!this.selectedJob?.log?.materials) return 0;
    return this.selectedJob.log.materials.reduce((total, item) => {
      return total + (item.quantity * item.price_per_unit || 0);
    }, 0);
  }

  calculateGrandTotal(): number {
    const labour = this.selectedJob?.log?.labour_cost || 0;
    const plantTools = this.calculatePlantToolsTotal();
    const materials = this.calculateMaterialsTotal();
    return labour + plantTools + materials;
  }

  formatOperativeType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  formatJobType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  getPayRateDisplay(payRate?: number): string {
    if (payRate === null || payRate === undefined) {
      return 'Pay not set';
    }
    return `£${payRate.toFixed(2)}/hr`;
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(dateTime: string): string {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getOperativeNames(operatives: Array<{ name: string }>): string {
    if (!operatives || operatives.length === 0) {
      return 'No operatives assigned';
    }
    return operatives.map(op => op.name).join(', ');
  }

  loadAIAnalysis(job: CompletedJob): void {
    this.isLoadingAI = true;

    const plantCost = job.log?.plant_items?.reduce((total, item) => {
      return total + (item.quantity * item.price_per_unit || 0);
    }, 0) || 0;

    const materialsCost = job.log?.materials?.reduce((total, item) => {
      return total + (item.quantity * item.price_per_unit || 0);
    }, 0) || 0;

    const labourCost = job.log?.labour_cost || 0;
    const totalCost = labourCost + plantCost + materialsCost;

    const operativeNames = job.assigned_operatives.map(op => op.name);

    const requestBody = {
      job_title: job.title,
      job_type: job.job_type,
      hours_on_site: job.log?.hours_on_site || 0,
      labour_cost: labourCost,
      plant_cost: plantCost,
      materials_cost: materialsCost,
      total_cost: totalCost,
      operative_names: operativeNames,
      notes: job.log?.notes || '',
    };

    this.http
      .post<AIAnalysis>(
        `${environment.apiUrl}/qs/jobs/${job.id}/ai-analysis`,
        requestBody,
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.aiAnalysis = response.analysis;
          this.isLoadingAI = false;
        },
        error: (error) => {
          console.error('Error loading AI analysis:', error);
          this.aiAnalysis = 'Analysis unavailable';
          this.isLoadingAI = false;
        },
      });
  }

  private showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastColor = 'success';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastColor = 'danger';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    this.router.navigate(['/auth']);
  }
}
