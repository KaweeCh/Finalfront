import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Register, UpdateUser } from '../../../../model/model';
import { ApiService } from '../../../../services/api-service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-profile-dialog',
  standalone: true,
  templateUrl: './update-profile-dialog.component.html',
  styleUrls: ['./update-profile-dialog.component.scss'],
  imports: [
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    CommonModule,
  ],
})
export class UpdateProfileDialogComponent implements OnInit {
  userData: any;
  selectedImage: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<UpdateProfileDialogComponent>,
    private router: Router,
    public api: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.setUser();
    console.log(this.userData);
    
  }

  setUser() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      this.userData = JSON.parse(userDataString);
    }
  }

  protected requestBody!: UpdateUser;

  onNoClick(): void {
    this.dialogRef.close();
  }

  cancel(): void {
    this.dialogRef.close();
  }
  

  isFieldEmpty(...fields: string[]): boolean {
    if (fields.some((field) => !field)) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return true;
    }
    return false;
  }

  isPasswordMismatch(password: string, confirm: string): boolean {
    if (password !== confirm) {
      alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return true;
    }
    return false;
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    try {
      const response = await this.api.updateProfileUser(
        file,
        this.userData.userID
      );
      // Update profile image in userData
      this.userData.image = response.image;

      

      // Display the selected image immediately
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.userData.image = reader.result as string;
      };

      // Store updated userData in local storage
      localStorage.setItem('userData', JSON.stringify(this.userData));

      // Fetch updated user profile
      await this.api.getProfileUserImage(this.userData.userID); // Assuming this method exists in your API service

      // Show success alert
      window.alert('Profile image updated successfully');
    } catch (error) {
      console.error('An error occurred while uploading the image', error);
    }
  }

  async changeUsername(
    newUsername: string,
    newEmail: string,
    confirmPassword: string
  ) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let update: any = [];
    if (!newUsername) {
      alert('Please enter a username');
      return;
    }

    if (!emailRegex.test(newEmail)) {
      alert('Invalid email format');
      return;
    }

    if (!confirmPassword) {
      alert('Please enter your password to confirm identity');
      return;
    } else if (confirmPassword !== this.userData.password) {
      alert('Incorrect password');
      return;
    }

    if (newUsername === this.userData.username) {
      update = [
        {
          email: newEmail,
          oldPassword: confirmPassword,
        },
      ];
    } else {
      update = [
        {
          username: newUsername,
          email: newEmail,
          oldPassword: confirmPassword,
        },
      ];
    }
    let response = await this.api.userUpdate(this.userData.userID, update);
    if (response) {
      this.userData.username = newUsername;
      this.userData.email = newEmail;

      // Update userData in local storage
      localStorage.setItem('userData', JSON.stringify(this.userData));

      // Fetch updated user profile
      await this.api.getProfileUserImage(this.userData.userID); // Assuming this method exists in your API service

      // Show success alert
      window.alert('Profile updated successfully');

      // Refresh the page
      window.location.reload();
    }
  }
}
