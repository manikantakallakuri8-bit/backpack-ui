import { Component, OnInit, ViewChild } from '@angular/core';
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
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButtons,
  ModalController,
  IonText,
  IonLoading,
  IonAlert,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut, pencilOutline, trashOutline } from 'ionicons/icons';
import { environment } from '../../environments/environment';

interface Operative {
  id: string;
  name: string;
  email: string;
  operative_type: string;
  pay_rate?: number;
}

interface AssignedOperative {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  location: string;
  job_type: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  assigned_operatives: AssignedOperative[];
}

interface Resource {
  id: string;
  name: string;
  category: 'material' | 'plant_tool';
  price_per_unit: number;
  unit_label: string;
}

@Component({
  selector: 'app-supervisor',
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
    IonSearchbar,
    IonCard,
    IonCardContent,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButtons,
    IonText,
    IonLoading,
    IonAlert,
  ],
  templateUrl: './supervisor.page.html',
  styleUrls: ['./supervisor.page.scss'],
})
export class SupervisorPage implements OnInit {
  @ViewChild('addOperativeModal') addOperativeModal: IonModal | undefined;
  @ViewChild('createJobModal') createJobModal: IonModal | undefined;
  @ViewChild('editPayModal') editPayModal: IonModal | undefined;
  @ViewChild('editJobModal') editJobModal: IonModal | undefined;

  selectedTab: 'operatives' | 'jobs' | 'resources' = 'operatives';
  operatives: Operative[] = [];
  filteredOperatives: Operative[] = [];
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  resources: Resource[] = [];
  materialResources: Resource[] = [];
  plantToolResources: Resource[] = [];
  selectedResourceCategory: 'material' | 'plant_tool' = 'material';

  operativeSearchText = '';
  jobSearchText = '';

  addOperativeForm!: FormGroup;
  createJobForm!: FormGroup;
  editPayForm!: FormGroup;
  editJobForm!: FormGroup;
  addResourceForm!: FormGroup;
  editResourceForm!: FormGroup;

  operativeTypes = [
    'street_lighting',
    'civils',
    'hiab',
    'electrician',
    'icp_jointer',
  ];
  jobTypes = [
    'fault_repair',
    'lamp_change',
    'column_installation',
    'electrical_testing',
    'visual_inspection',
    'emergency_attendance',
  ];

  isLoading = false;
  showAddOperativeModal = false;
  showCreateJobModal = false;
  showEditPayModal = false;
  showEditJobModal = false;
  showDeleteJobAlert = false;
  showAddResourceModal = false;
  showEditResourceModal = false;
  showDeleteResourceAlert = false;
  selectedOperativeIds: string[] = [];
  selectedEditOperativeIds: string[] = [];
  selectedOperativeForPay: Operative | null = null;
  selectedJobForEdit: Job | null = null;
  selectedJobForDelete: Job | null = null;
  selectedResourceForEdit: Resource | null = null;
  selectedResourceForDelete: Resource | null = null;

  // Delete job alert buttons
  deleteJobAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.closeDeleteJobAlert();
      },
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => {
        this.confirmDeleteJob();
      },
    },
  ];
  
  // Delete resource alert buttons
  deleteResourceAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.closeDeleteResourceAlert();
      },
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => {
        this.confirmDeleteResource();
      },
    },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ logOut, pencilOutline, trashOutline });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadOperatives();
    this.loadJobs();
    this.loadResources();
  }


    onTabChange(event: any) {
    const value = event.detail.value;

    if (value === 'operatives' || value === 'jobs' || value === 'resources') {
      this.selectedTab = value;
    }
  }
    formatStatus(status: string): string {
    return status.replace(/_/g, ' ').toUpperCase();
    }
  private initializeForms(): void {
    this.addOperativeForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      operative_type: ['', [Validators.required]],
      pay_rate: ['', [Validators.required, Validators.min(10)]],
    });

    this.createJobForm = this.fb.group({
      title: ['', [Validators.required]],
      location: ['', [Validators.required]],
      job_type: ['', [Validators.required]],
      description: ['', [Validators.required]],
      assigned_operatives: [[]],
    });

    this.editPayForm = this.fb.group({
      pay_rate: ['', [Validators.required, Validators.min(10)]],
    });

    this.editJobForm = this.fb.group({
      title: ['', [Validators.required]],
      location: ['', [Validators.required]],
      job_type: ['', [Validators.required]],
      description: ['', [Validators.required]],
      assigned_operatives: [[]],
    });

    this.addResourceForm = this.fb.group({
      name: ['', [Validators.required]],
      price_per_unit: ['', [Validators.required]],
      unit_label: ['', [Validators.required]],
    });

    this.editResourceForm = this.fb.group({
      name: ['', [Validators.required]],
      price_per_unit: ['', [Validators.required]],
      unit_label: ['', [Validators.required]],
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  loadOperatives(): void {
    this.isLoading = true;
    this.http
      .get<Operative[]>(`${environment.apiUrl}/operatives`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.operatives = data;
          this.filterOperatives();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading operatives:', error);
          this.isLoading = false;
        },
      });
  }

  loadJobs(): void {
    this.isLoading = true;
    this.http
      .get<Job[]>(`${environment.apiUrl}/jobs`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.jobs = data;
          this.filterJobs();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading jobs:', error);
          this.isLoading = false;
        },
      });
  }

  filterOperatives(): void {
    if (!this.operativeSearchText.trim()) {
      this.filteredOperatives = [...this.operatives];
    } else {
      const searchTerm = this.operativeSearchText.toLowerCase();
      this.filteredOperatives = this.operatives.filter((op) =>
        op.name.toLowerCase().includes(searchTerm)
      );
    }
  }

  filterJobs(): void {
    if (!this.jobSearchText.trim()) {
      this.filteredJobs = [...this.jobs];
    } else {
      const searchTerm = this.jobSearchText.toLowerCase();
      this.filteredJobs = this.jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm) ||
          job.location.toLowerCase().includes(searchTerm)
      );
    }
  }

  onOperativeSearch(event: any): void {
    this.operativeSearchText = event.detail.value || '';
    this.filterOperatives();
  }

  onJobSearch(event: any): void {
    this.jobSearchText = event.detail.value || '';
    this.filterJobs();
  }

  openAddOperativeModal(): void {
    this.showAddOperativeModal = true;
    this.addOperativeForm.reset();
  }

  closeAddOperativeModal(): void {
    this.showAddOperativeModal = false;
    this.addOperativeForm.reset();
  }

  openCreateJobModal(): void {
    this.showCreateJobModal = true;
    this.createJobForm.reset();
    this.selectedOperativeIds = [];
  }

  closeCreateJobModal(): void {
    this.showCreateJobModal = false;
    this.createJobForm.reset();
    this.selectedOperativeIds = [];
  }

  submitAddOperative(): void {
    if (this.addOperativeForm.invalid) {
      return;
    }

    const formData = {
      ...this.addOperativeForm.value,
      role: 'operative',
    };

    this.isLoading = true;
    this.http
      .post<any>(`${environment.apiUrl}/register`, formData, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.loadOperatives();
          this.closeAddOperativeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error adding operative:', error);
          this.isLoading = false;
        },
      });
  }

  openEditPayModal(operative: Operative): void {
    this.selectedOperativeForPay = operative;
    this.editPayForm.patchValue({
      pay_rate: operative.pay_rate || '',
    });
    this.showEditPayModal = true;
  }

  closeEditPayModal(): void {
    this.showEditPayModal = false;
    this.selectedOperativeForPay = null;
    this.editPayForm.reset();
  }

  submitEditPay(): void {
    if (!this.selectedOperativeForPay || this.editPayForm.invalid) {
      return;
    }

    const payRate = this.editPayForm.get('pay_rate')?.value;
    this.isLoading = true;

    this.http
      .put<any>(
        `${environment.apiUrl}/operatives/${this.selectedOperativeForPay.id}/pay`,
        { pay_rate: payRate },
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.loadOperatives();
          this.closeEditPayModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating pay rate:', error);
          this.isLoading = false;
        },
      });
  }

  submitCreateJob(): void {
    if (this.createJobForm.invalid) {
      return;
    }

    const formData = {
      title: this.createJobForm.get('title')?.value,
      location: this.createJobForm.get('location')?.value,
      job_type: this.createJobForm.get('job_type')?.value,
      description: this.createJobForm.get('description')?.value,
      assigned_operatives: this.selectedOperativeIds,
    };

    this.isLoading = true;
    this.http
      .post<any>(`${environment.apiUrl}/jobs`, formData, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.loadJobs();
          this.closeCreateJobModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating job:', error);
          this.isLoading = false;
        },
      });
  }

  openEditJobModal(job: Job): void {
    this.selectedJobForEdit = job;
    this.selectedEditOperativeIds = job.assigned_operatives.map((op) => op.id);
    this.editJobForm.patchValue({
      title: job.title,
      location: job.location,
      job_type: job.job_type,
      description: job.description,
      assigned_operatives: this.selectedEditOperativeIds,
    });
    this.showEditJobModal = true;
  }

  closeEditJobModal(): void {
    this.showEditJobModal = false;
    this.selectedJobForEdit = null;
    this.selectedEditOperativeIds = [];
    this.editJobForm.reset();
  }

  submitEditJob(): void {
    if (!this.selectedJobForEdit || this.editJobForm.invalid) {
      return;
    }

    const formData = {
      title: this.editJobForm.get('title')?.value,
      location: this.editJobForm.get('location')?.value,
      job_type: this.editJobForm.get('job_type')?.value,
      description: this.editJobForm.get('description')?.value,
      assigned_operatives: this.selectedEditOperativeIds,
    };

    this.isLoading = true;
    this.http
      .put<any>(`${environment.apiUrl}/jobs/${this.selectedJobForEdit.id}`, formData, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.loadJobs();
          this.closeEditJobModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating job:', error);
          this.isLoading = false;
        },
      });
  }

  openDeleteJobAlert(job: Job): void {
    this.selectedJobForDelete = job;
    this.showDeleteJobAlert = true;
  }

  closeDeleteJobAlert(): void {
    this.showDeleteJobAlert = false;
    this.selectedJobForDelete = null;
  }

  confirmDeleteJob(): void {
    if (!this.selectedJobForDelete) {
      return;
    }

    this.isLoading = true;
    this.http
      .delete<any>(`${environment.apiUrl}/jobs/${this.selectedJobForDelete.id}`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.loadJobs();
          this.closeDeleteJobAlert();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting job:', error);
          this.isLoading = false;
        },
      });
  }

  onOperativeSelectionChange(event: any): void {
    this.selectedOperativeIds = event.detail.value || [];
  }

  onEditOperativeSelectionChange(event: any): void {
    this.selectedEditOperativeIds = event.detail.value || [];
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#00cc00'; // Green
      case 'in_progress':
        return '#FFCD00'; // Yellow
      case 'not_started':
      default:
        return '#999999'; // Grey
    }
  }

  getStatusBadgeTextColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#ffffff';
      case 'in_progress':
        return '#000000'; // Black text on yellow
      case 'not_started':
      default:
        return '#ffffff';
    }
  }

  getAssignedOperativesText(job: Job): string {
    if (!job.assigned_operatives || job.assigned_operatives.length === 0) {
      return 'No operatives assigned';
    }
    return job.assigned_operatives.map((op) => op.name).join(', ');
  }

  getPayRateDisplay(payRate?: number): string {
    if (payRate === null || payRate === undefined) {
      return 'Pay not set';
    }
    return `£${payRate.toFixed(2)} / hr`;
  }

  formatOperativeType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  formatJobType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  compareOperatives(o1: any, o2: any): boolean {
    return o1 === o2;
  }

  // RESOURCE MANAGEMENT METHODS

  loadResources(): void {
    this.isLoading = true;
    this.http
      .get<Resource[]>(`${environment.apiUrl}/resources`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.resources = response;
          this.separateResources();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading resources:', error);
          this.isLoading = false;
        },
      });
  }

  private separateResources(): void {
    this.materialResources = this.resources.filter(
      (r) => r.category === 'material'
    );
    this.plantToolResources = this.resources.filter(
      (r) => r.category === 'plant_tool'
    );
  }

  openAddResourceModal(): void {
    this.addResourceForm.reset();
    this.showAddResourceModal = true;
  }

  closeAddResourceModal(): void {
    this.showAddResourceModal = false;
    this.addResourceForm.reset();
  }

  submitAddResource(): void {
    if (this.addResourceForm.invalid) {
      return;
    }

    const formData = {
      name: this.addResourceForm.get('name')?.value,
      category: this.selectedResourceCategory,
      price_per_unit: this.addResourceForm.get('price_per_unit')?.value,
      unit_label: this.addResourceForm.get('unit_label')?.value,
    };

    this.isLoading = true;
    this.http
      .post<any>(`${environment.apiUrl}/resources`, formData, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.loadResources();
          this.closeAddResourceModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating resource:', error);
          this.isLoading = false;
        },
      });
  }

  openEditResourceModal(resource: Resource): void {
    this.selectedResourceForEdit = resource;
    this.editResourceForm.patchValue({
      name: resource.name,
      price_per_unit: resource.price_per_unit,
      unit_label: resource.unit_label,
    });
    this.showEditResourceModal = true;
  }

  closeEditResourceModal(): void {
    this.showEditResourceModal = false;
    this.selectedResourceForEdit = null;
    this.editResourceForm.reset();
  }

  submitEditResource(): void {
    if (!this.selectedResourceForEdit || this.editResourceForm.invalid) {
      return;
    }

    const formData = {
      name: this.editResourceForm.get('name')?.value,
      category: this.selectedResourceForEdit.category,
      price_per_unit: this.editResourceForm.get('price_per_unit')?.value,
      unit_label: this.editResourceForm.get('unit_label')?.value,
    };

    this.isLoading = true;
    this.http
      .put<any>(
        `${environment.apiUrl}/resources/${this.selectedResourceForEdit.id}`,
        formData,
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.loadResources();
          this.closeEditResourceModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating resource:', error);
          this.isLoading = false;
        },
      });
  }

  openDeleteResourceAlert(resource: Resource): void {
    this.selectedResourceForDelete = resource;
    this.showDeleteResourceAlert = true;
  }

  closeDeleteResourceAlert(): void {
    this.showDeleteResourceAlert = false;
    this.selectedResourceForDelete = null;
  }

  confirmDeleteResource(): void {
    if (!this.selectedResourceForDelete) {
      return;
    }

    this.isLoading = true;
    this.http
      .delete<any>(
        `${environment.apiUrl}/resources/${this.selectedResourceForDelete.id}`,
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.loadResources();
          this.closeDeleteResourceAlert();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting resource:', error);
          this.isLoading = false;
        },
      });
  }

  onResourceCategoryChange(category: any): void {
    if (category === 'material' || category === 'plant_tool') {
      this.selectedResourceCategory = category;
    }
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
