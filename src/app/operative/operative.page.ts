import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonModal,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButtons,
  ModalController,
  IonText,
  IonLoading,
  IonAlert,
  IonToast,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut, closeCircleOutline, addCircleOutline } from 'ionicons/icons';
import { environment } from '../../environments/environment';

interface JobLog {
  vehicles: VehicleLog[];
  plant_items: ToolLog[];
  materials: MaterialLog[];
  notes: string;
}

interface VehicleLog {
  vehicle_type: string;
  registration: string;
  arrival_time: string;
}

interface ToolLog {
  item_name: string;
  quantity: number;
}

interface MaterialLog {
  item_name: string;
  quantity: number;
}

interface Job {
  id: string;
  title: string;
  location: string;
  job_type: string;
  status: 'not_started' | 'in_progress' | 'completed';
  log?: {
    vehicles: VehicleLog[];
    plant_items: ToolLog[];
    materials: MaterialLog[];
    notes: string;
    hours_on_site?: number;
    labour_cost?: number;
  };
}

interface Resource {
  id: string;
  name: string;
  category: 'material' | 'plant_tool';
  price_per_unit: number;
  unit_label: string;
}


@Component({
  selector: 'app-operative',
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
    IonButton,
    IonCard,
    IonCardContent,
    IonModal,
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
    IonToast,
  ],
  templateUrl: './operative.page.html',
  styleUrls: ['./operative.page.scss'],
})
export class OperativePage implements OnInit {
  @ViewChild('logDetailsModal') logDetailsModal: IonModal | undefined;

  jobs: Job[] = [];
  selectedJob: Job | null = null;
  isLoading = false;
  showCompleteJobAlert = false;
  showToast = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' | 'warning' = 'success';
  plantToolResources: Resource[] = [];
  materialResources: Resource[] = [];
  jobToComplete: Job | null = null;

  logForm!: FormGroup;

  completeJobAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.closeCompleteJobAlert();
      },
    },
    {
      text: 'Complete',
      role: 'destructive',
      handler: () => {
        this.confirmCompleteJob();
      },
    },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ logOut, closeCircleOutline, addCircleOutline });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadResources();
    this.loadJobs();
  }

  private initializeForm(): void {
    this.logForm = this.fb.group({
      vehicles: this.fb.array([]),
      plant_items: this.fb.array([]),
      materials: this.fb.array([]),
      notes: ['', [Validators.required]],
      logout_time: ['', [Validators.required]],
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  loadJobs(): void {
    this.isLoading = true;
    this.http
      .get<Job[]>(`${environment.apiUrl}/operative/jobs`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.jobs = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading jobs:', error);
          this.isLoading = false;
        },
      });
  }

  formatJobType(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').toUpperCase();
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

  startJob(job: Job): void {
    this.isLoading = true;
    this.http
      .post<any>(
        `${environment.apiUrl}/logs/start/${job.id}`,
        {},
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.loadJobs();
          this.showSuccessToast('Job started successfully');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error starting job:', error);
          this.showErrorToast('Failed to start job');
          this.isLoading = false;
        },
      });
  }

  openLogDetailsModal(job: Job): void {
    this.selectedJob = job;
    this.resetLogForm();

    if (job.log) {
        if (job.log.vehicles && job.log.vehicles.length > 0) {
        const vehiclesArray = this.logForm.get('vehicles') as FormArray;
        job.log.vehicles.forEach((vehicle) => {
            // Convert ISO string to datetime-local format
            let arrivalTime = '';
            if (vehicle.arrival_time) {
            arrivalTime = new Date(vehicle.arrival_time)
                .toISOString()
                .slice(0, 16);
            }
            vehiclesArray.push(
            this.fb.group({
                vehicle_type: [vehicle.vehicle_type, [Validators.required]],
                registration: [vehicle.registration, [Validators.required]],
                arrival_time: [arrivalTime, [Validators.required]],
            })
            );
        });
        }

        if (job.log.plant_items && job.log.plant_items.length > 0) {
        const plantItemsArray = this.logForm.get('plant_items') as FormArray;
        job.log.plant_items.forEach((tool) => {
            plantItemsArray.push(
            this.fb.group({
                item_name: [tool.item_name, [Validators.required]],
                quantity: [tool.quantity, [Validators.required, Validators.min(1)]],
            })
            );
        });
        }

        if (job.log.materials && job.log.materials.length > 0) {
        const materialsArray = this.logForm.get('materials') as FormArray;
        job.log.materials.forEach((material) => {
            materialsArray.push(
            this.fb.group({
                item_name: [material.item_name, [Validators.required]],
                quantity: [material.quantity, [Validators.required, Validators.min(1)]],
            })
            );
        });
        }

        // Convert logout_time ISO string to datetime-local format
        let logoutTime = '';
        if ((job.log as any).logout_time) {
        logoutTime = new Date((job.log as any).logout_time)
            .toISOString()
            .slice(0, 16);
        }

        this.logForm.patchValue({
        notes: job.log.notes || '',
        logout_time: logoutTime,
        });
    }
    }

  closeLogDetailsModal(): void {
    this.resetLogForm();
    this.selectedJob = null;
  }

  private resetLogForm(): void {
    this.logForm.reset({
      vehicles: [],
      plant_items: [],
      materials: [],
      notes: '',
      logout_time: '',
    });

    const vehiclesArray = this.logForm.get('vehicles') as FormArray;
    const plantToolsArray = this.logForm.get('plant_items') as FormArray;
    const materialsArray = this.logForm.get('materials') as FormArray;

    while (vehiclesArray.length > 0) {
      vehiclesArray.removeAt(0);
    }
    while (plantToolsArray.length > 0) {
      plantToolsArray.removeAt(0);
    }
    while (materialsArray.length > 0) {
      materialsArray.removeAt(0);
    }
  }

  get vehiclesArray(): FormArray {
    return this.logForm.get('vehicles') as FormArray;
  }

  get plantToolsArray(): FormArray {
    return this.logForm.get('plant_items') as FormArray;
  }

  get materialsArray(): FormArray {
    return this.logForm.get('materials') as FormArray;
  }

  addVehicle(): void {
    this.vehiclesArray.push(
      this.fb.group({
        vehicle_type: ['', [Validators.required]],
        registration: ['', [Validators.required]],
        arrival_time: ['', [Validators.required]],
      })
    );
  }

  removeVehicle(index: number): void {
    this.vehiclesArray.removeAt(index);
  }

  addPlantTool(): void {
    this.plantToolsArray.push(
      this.fb.group({
        item_name: ['', [Validators.required]],
        quantity: ['', [Validators.required, Validators.min(1)]],
      })
    );
  }

  removePlantTool(index: number): void {
    this.plantToolsArray.removeAt(index);
  }

  addMaterial(): void {
    this.materialsArray.push(
      this.fb.group({
        item_name: ['', [Validators.required]],
        quantity: ['', [Validators.required, Validators.min(1)]],
      })
    );
  }

  removeMaterial(index: number): void {
    this.materialsArray.removeAt(index);
  }

  submitLogDetails(): void {
    if (!this.selectedJob || this.logForm.invalid) {
      this.showErrorToast('Please fill in all required fields');
      return;
    }

  const formData = this.logForm.value;
  if (formData.vehicles && formData.vehicles.length > 0) {
    formData.vehicles.forEach((vehicle: VehicleLog) => {
      if (vehicle.arrival_time) {
        vehicle.arrival_time = vehicle.arrival_time + ':00.000Z';
      }
    });
  }

  if (formData.logout_time) {
    formData.logout_time = formData.logout_time + ':00.000Z';
  }

    this.isLoading = true;
    this.http
      .put<any>(
        `${environment.apiUrl}/logs/update/${this.selectedJob.id}`,
        formData,
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.closeLogDetailsModal();
          this.loadJobs();
          this.showSuccessToast('Job details saved successfully');
        },
        error: (error) => {
          console.error('Error saving job details:', error);
          this.isLoading = false;
          this.showErrorToast('Failed to save job details');
        },
      });
  }

  openCompleteJobAlert(job: Job): void {
    this.jobToComplete = job;
    this.showCompleteJobAlert = true;
  }

  closeCompleteJobAlert(): void {
    this.showCompleteJobAlert = false;
    this.jobToComplete = null;
  }

  confirmCompleteJob(): void {
    if (!this.jobToComplete) {
        return;
    }
    this.isLoading = true;
    this.http
        .put<any>(
        `${environment.apiUrl}/logs/complete/${this.jobToComplete.id}`,
        {},
        { headers: this.getAuthHeaders() }
        )
        .subscribe({
        next: (response) => {
            this.isLoading = false;
            this.closeCompleteJobAlert();
            this.loadJobs();
            window.location.reload();
            this.showSuccessToast('Job marked as complete');
        },
        error: (error) => {
            console.error('Error completing job:', error);
            this.isLoading = false;
            this.showErrorToast('Failed to complete job');
        },
        });
  }

  isReadOnly(): boolean {
    return this.selectedJob?.status === 'completed';
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

  // RESOURCE MANAGEMENT METHODS

  private loadResources(): void {
    this.http
      .get<Resource[]>(`${environment.apiUrl}/resources`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.plantToolResources = response.filter(
            (r) => r.category === 'plant_tool'
          );
          this.materialResources = response.filter(
            (r) => r.category === 'material'
          );
        },
        error: (error) => {
          console.error('Error loading resources:', error);
        },
      });
  }

  async showPlantToolActionSheet(index: number): Promise<void> {
    if (this.plantToolResources.length === 0) {
      this.showErrorToast('No plant & tools available');
      return;
    }

    const buttons: any[] = this.plantToolResources.map((resource) => ({
      text: resource.name,
      handler: () => {
        this.selectPlantToolResource(index, resource);
      },
    }));

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Select Plant & Tool',
      buttons: buttons,
    });

    await actionSheet.present();
  }

  async showMaterialActionSheet(index: number): Promise<void> {
    if (this.materialResources.length === 0) {
      this.showErrorToast('No materials available');
      return;
    }

    const buttons: any[] = this.materialResources.map((resource) => ({
      text: resource.name,
      handler: () => {
        this.selectMaterialResource(index, resource);
      },
    }));

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Select Material',
      buttons: buttons,
    });

    await actionSheet.present();
  }

  private selectPlantToolResource(index: number, resource: Resource): void {
    const plantToolsArray = this.logForm.get('plant_items') as FormArray;
    if (plantToolsArray && plantToolsArray.at(index)) {
      plantToolsArray.at(index).get('item_name')?.setValue(resource.name);
    }
  }

  private selectMaterialResource(index: number, resource: Resource): void {
    const materialsArray = this.logForm.get('materials') as FormArray;
    if (materialsArray && materialsArray.at(index)) {
      materialsArray.at(index).get('item_name')?.setValue(resource.name);
    }
  }
}
