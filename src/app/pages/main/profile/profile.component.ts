import { Component, OnInit, ViewChild } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { User, imageUpload, imageUser, rankID } from '../../../model/model';
import { ApiService } from '../../../services/api-service';
import { ShareService } from '../../../services/share.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { UpdateProfileDialogComponent } from './edit-profile/update-profile-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { UpdatePasswordDialogComponent } from './edit-password/update-password-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  url: string = 'sgshdh';
  constructor(
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router,
    private dialog: MatDialog
  ) {}
  Today: imageUser[] = [];
  Yesterday: imageUser[] = [];
  id: any;
  public images: imageUser[] = [];
  httpError: boolean = false;
  imageCount: number = 0;
  isAddIconTransformed: boolean = false;
  selectedFile: File | undefined;
  changeimg: File | undefined;
  updatefile: File | undefined;
  uploading: boolean = false;
  userData: User | undefined;
  deleteSelect: number[] = [];
  rank: rankID[] = [];
  async ngOnInit() {
    this.checkLogin();
    this.setData();
    this.getImage();
  }

  async getImage() {
    this.getTopImageData();
    this.getRank(this.Today, this.Yesterday);
    await this.shareData.getImage(this.id);
    this.images = this.shareData.images;
    this.imageCount = this.images.length;
    if (this.userData) {
      console.log('Profile Image URL:', this.userData.image);
    } else {
      console.log('No user data available');
    }
  }

  setData() {
    this.id = localStorage.getItem('userID');
    const userDataString = localStorage.getItem('userData');
    this.userData = userDataString ? JSON.parse(userDataString) : null;
  }

  checkLogin() {
    if (!localStorage.getItem('userData') || !localStorage.getItem('userID')) {
      this.navigateToLogin();
    }
  }

  toggleTransform(id: number, event: Event) {
    const findIndex = this.deleteSelect.findIndex((item) => item === id);
    const icon = event.currentTarget as HTMLElement;
    icon.classList.toggle('transformed');
    if (findIndex !== -1) {
      this.deleteSelect.splice(findIndex, 1);
    } else {
      this.deleteSelect.push(id);
    }
    console.log(this.deleteSelect);
  }

  handleFileInput(event: any) {
    this.selectedFile = event.target.files[0];
  }

  handleFileChange(event: any, imageID: number) {
    const file = event.target.files[0];
    this.changeimguser(imageID, file);
  }

  async changeimguser(imageID: number, file: File) {
    try {
      this.uploading = true;
      if (file) {
        console.log('File uploaded successfully', file);
        const checkimg = await this.api.ChangeImage(imageID, file);
        if (checkimg) {
          // อัปเดตข้อมูลในอนาคต
          await this.getImage();
          window.location.reload();
        } else {
          console.log('Error', checkimg);
        }
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      this.uploading = false;
    }
  }

  async sendFile(userID: string) {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }

    if (this.images.length >= 5) {
      window.alert('Cannot upload more than 5 images');
      this.selectedFile = undefined;
      return;
    }

    try {
      this.uploading = true;
      const uploadedImage = await this.api.uploadImage(
        this.selectedFile,
        userID
      );
      console.log('Uploaded image:', uploadedImage);

      await this.getImage();

      this.selectedFile = undefined;
      window.alert('Image uploaded successfully');
    } catch (error) {
      this.selectedFile = undefined;
      console.error('Error uploading image:', error);
      window.alert('Failed to upload image');
    } finally {
      this.uploading = false;
    }
  }

  async getTopImageData() {
    this.Today = await this.api.gettodayrank();
    this.Yesterday = await this.api.getyesterdayrank();
    console.log('Today', this.Today);
    console.log('Yesterday', this.Yesterday);
    this.getRank(this.Today, this.Yesterday);
  }

  getRank(today: imageUser[], yesterday: imageUser[]): void {
    for (let i = 0; i < today.length; i++) {
      const todayImage = today[i];
      const yesterdayImage = yesterday.find(
        (img) => img.imageID === todayImage.imageID
      ); // Use '===' for comparison
      if (yesterdayImage) {
        const difference = yesterdayImage.rankYesterday - todayImage.rankToday; // Calculate the rank difference
        const rankNow: rankID = {
          imageID: todayImage.imageID,
          rankDiff: difference,
          url: todayImage.url,
          username: todayImage.username,
          voteScore: todayImage.count,
        };
        this.rank.push(rankNow);
      } else {
        // Handle if the image is new today and was not present yesterday
        const rankNow: rankID = {
          imageID: todayImage.imageID,
          rankDiff: 0,
          url: todayImage.url,
          username: todayImage.username,
          voteScore: todayImage.count,
        };
        this.rank.push(rankNow);
      }
    }
    console.log(this.rank);
  }

  editProfile(): void {
    const dialogRef = this.dialog.open(UpdateProfileDialogComponent, {
      width: '500px',
      data: { userData: this.userData },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  editPassword(): void {
    const dialogRef = this.dialog.open(UpdatePasswordDialogComponent, {
      width: '500px',
      data: { userId: this.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  async deleteImage(id: number) {
    const userConfirmed = window.confirm('Do you want to delete this image?');

    if (userConfirmed) {
      const status = await this.api.deleteImagebyId(id);
      window.location.reload();
    } else {
      console.log('Canceled image deletion');
    }
  }

  async deleteAllImage() {
    if (!this.deleteSelect || this.deleteSelect.length === 0) {
      window.alert('Please select an image');
    } else {
      const userConfirmed = window.confirm(
        'Do you want to delete the selected images?'
      );
      if (userConfirmed) {
        for (const i of this.deleteSelect) {
          const status = await this.api.deleteImagebyId(i);
        }
        this.deleteSelect = [];
        window.location.reload();
      } else {
        console.log('Canceled image deletion');
      }
    }
  }

  navigateChart(imageId: number) {
    this.router.navigate(['/chart', imageId]);
  }

  navigateToMain() {
    this.router.navigate(['/']);
  }

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  clearData() {
    this.shareData.userData = undefined;
  }

  navigateProfile() {
    this.router.navigate(['/profile']);
  }

  navigateTop() {
    this.router.navigate(['/top10']);
  }
}
